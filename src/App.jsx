/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  state = {
    events: [],
    active: null,

    /* arrays que acumulam até você “Salvar” */
    pendingAdds:    [],
    pendingUpdates: [],
    pendingRemoves: [],

    /* opcional: debug local */
    debugData: null,
  };

  /* ===== ciclo de vida ===== */
  componentDidMount() {
  this.loadEvents();

  if (typeof Lowcoder !== 'undefined') {
    Lowcoder.custom1 = Lowcoder.custom1 || {};
    Lowcoder.custom1.removeActive = () => {
      if (this.state.active) {
        this.handleRemove(this.state.active.id);
      }
    };
  }
}


  componentDidUpdate(prevProps) {
  const beforeRaw = prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
  const afterRaw  = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;

  // Só recarrega se mudou mesmo
  const before = JSON.stringify(beforeRaw || []);
  const after  = JSON.stringify(afterRaw || []);
  if (before !== after) this.loadEvents();
}


  /* ===== helpers ===== */
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

      // zera filas quando recarrega da base
      pendingAdds:    [],
      pendingUpdates: [],
      pendingRemoves: [],
    });
  };

  blkPayload = (b) => ({
    id: b.id,
    inicio: b.start.toISOString(),
    fim:    b.end.toISOString(),
  });

  /** envia adds/updates/removes consolidados */
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

  /* ===== callbacks Timeline ===== */
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
        const payload = this.blkPayload(blk);

        const inAdds      = prev.pendingAdds.some((p) => p.id === blk.id);
        const inUpdates   = prev.pendingUpdates.some((u) => u.id === blk.id);

        const adds    = inAdds
          ? prev.pendingAdds.map((p) => (p.id === blk.id ? payload : p))
          : prev.pendingAdds;

        const updates = inAdds
          ? prev.pendingUpdates                // já está em adds, não duplica
          : inUpdates
              ? prev.pendingUpdates.map((u) => (u.id === blk.id ? payload : u))
              : [...prev.pendingUpdates, payload];

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

  /* ===== render ===== */
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

        {/* Timeline só aparece quando há active para evitar erro start/null */}
        {active && (
          <Timeline
            bookings={events.filter((e) => e.status !== "bloqueado")}
            blocks={events.filter((e) => e.status === "bloqueado")}
            active={active}
            onChange={this.handleUpdate}
            onAdd={this.handleAdd}
            onSelect={this.handleSelect}
          />
        )}

        {/* debug local opcional */}
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
