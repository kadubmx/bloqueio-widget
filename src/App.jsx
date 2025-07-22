/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  state = {
    events: [],
    active: null,

    /* arrays reais */
    pendingAdds:    [],
    pendingUpdates: [],
    pendingRemoves: [],

    debugData: null, // opcional
  };

  /* ------------- ciclo de vida ------------- */
  componentDidMount() {
    this.loadEvents();
  }

  componentDidUpdate(prevProps) {
    const before = prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
    const after  = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;
    if (before !== after) this.loadEvents();
  }

  /* ------------- helpers ------------- */
  loadEvents = () => {
    const data =
      this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];

    const parsed = data.map((ev) => ({
      ...ev,
      start: new Date(ev.inicio),
      end:   new Date(ev.fim),
      title:
        ev.status_agendamento === "bloqueado"
          ? "Bloqueio"
          : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
    }));

    this.setState({
      events: parsed,
      active: parsed.find((e) => e.status === "bloqueado") || null,
      pendingAdds:    [],
      pendingUpdates: [],
      pendingRemoves: [],
    });
  };

  /** envia arrays consolidados para Lowcoder */
  syncToModel = () => {
    const { updateModel } = this.props;
    if (!updateModel) return;

    const { pendingAdds, pendingUpdates, pendingRemoves } = this.state;
    updateModel({
      bloqueioWidget: {
        adds:    pendingAdds,
        updates: pendingUpdates,
        removes: pendingRemoves,
      },
    });
  };

  /** converte blk->payload (id, inicio, fim) */
  blkPayload = (blk) => ({
    id: blk.id,
    inicio: blk.start.toISOString(),
    fim:    blk.end.toISOString(),
  });

  /* ------------- callbacks da Timeline ------------- */
  handleAdd = (start, end) => {
    const novo = {
      id: Date.now(),
      start,
      end,
      title: "Novo Bloqueio",
      status: "bloqueado",
    };

    this.setState(
      (prev) => ({
        events: [...prev.events, novo],
        active: novo,
        pendingAdds: [...prev.pendingAdds, this.blkPayload(novo)],
        debugData: { origem: "add", id: novo.id },
      }),
      this.syncToModel
    );
  };

  handleUpdate = (blk) => {
    this.setState(
      (prev) => {
        // se está em pendingAdds, apenas atualiza a entrada lá
        const inAdds = prev.pendingAdds.find((p) => p.id === blk.id);
        let adds = [...prev.pendingAdds];
        let updates = [...prev.pendingUpdates];

        if (inAdds) {
          adds = adds.map((p) =>
            p.id === blk.id ? this.blkPayload(blk) : p
          );
        } else {
          const existsUpd = updates.find((u) => u.id === blk.id);
          if (existsUpd) {
            updates = updates.map((u) =>
              u.id === blk.id ? this.blkPayload(blk) : u
            );
          } else {
            updates.push(this.blkPayload(blk));
          }
        }

        return {
          events: prev.events.map((e) =>
            e.id === blk.id ? blk : e
          ),
          active: blk,
          pendingAdds: adds,
          pendingUpdates: updates,
          debugData: { origem: "update", id: blk.id },
        };
      },
      this.syncToModel
    );
  };

  handleSelect = (blk) => {
    this.setState({ active: blk });
  };

  /* remover via botão no BlockModal (se existir) */
  handleRemove = (blkId) => {
    this.setState(
      (prev) => ({
        events: prev.events.filter((e) => e.id !== blkId),
        active: null,
        pendingRemoves: [...prev.pendingRemoves, blkId],
        debugData: { origem: "remove", id: blkId },
      }),
      this.syncToModel
    );
  };

  /* ------------- render ------------- */
  render() {
    const { events, active, debugData } = this.state;

    return (
      <div style={{ padding: 20 }}>
        <h1>Bloqueios do Dia</h1>

        {active && (
          <>
            <h3>Editar Bloqueios</h3>
            <p>
              {moment(active.start).format("HH:mm")} –{" "}
              {moment(active.end).format("HH:mm")}
            </p>
          </>
        )}

        <Timeline
          bookings={events.filter((e) => e.status !== "bloqueado")}
          blocks={events.filter((e) => e.status === "bloqueado")}
          active={active}
          onChange={this.handleUpdate}
          onAdd={this.handleAdd}
          onSelect={this.handleSelect}
        />

        <div style={{ marginTop: 24, fontFamily: "monospace" }}>
          <h3>Debug local</h3>
          <pre style={{ background: "#f3f4f6", padding: 8 }}>
            {debugData
              ? JSON.stringify(debugData, null, 2)
              : "– nada –"}
          </pre>
        </div>
      </div>
    );
  }
}
