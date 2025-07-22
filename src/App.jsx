/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      active: null,

      /* arrays reais */
      pendingAdds:    [],
      pendingUpdates: [],
      pendingRemoves: [],

      /* opcional: debug local */
      debugData: null,
    };

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleAdd    = this.handleAdd.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  /* ========== helpers ========== */
  pushToModel() {
    if (this.props.updateModel) {
      const { pendingAdds, pendingUpdates, pendingRemoves } = this.state;
      this.props.updateModel({
        bloqueioWidget: {
          adds:    pendingAdds,
          updates: pendingUpdates,
          removes: pendingRemoves,
        },
      });
    }
  }
  /* ============================= */

  componentDidMount() {
    this.loadEvents();
  }

  componentDidUpdate(prevProps) {
    /* recarrega só se a lista de eventos da query mudar */
    const before = prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
    const after  = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;
    if (before !== after) this.loadEvents();
  }

  loadEvents() {
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

    const firstBlock =
      parsed.find((e) => e.status === "bloqueado") || null;

    this.setState({
      events: parsed,
      active: firstBlock,
      pendingAdds:    [],
      pendingUpdates: [],
      pendingRemoves: [],
    });
  }

  /* ---------- callbacks ---------- */
  handleAdd(start, end) {
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
        pendingAdds: [...prev.pendingAdds, {
          id: novo.id,
          inicio: start.toISOString(),
          fim:    end.toISOString(),
        }],
        debugData: { origem: "add", id: novo.id },
      }),
      () => this.pushToModel()
    );
  }

  handleUpdate(blk) {
    this.setState(
      (prev) => {
        const isNew = prev.pendingAdds.some((p) => p.id === blk.id) ||
                      !prev.events.some((e) => e.id === blk.id && e.status === "bloqueado");

        let pendingAdds    = [...prev.pendingAdds];
        let pendingUpdates = [...prev.pendingUpdates];

        if (isNew) {
          /* bloqueio recém‑criado ainda não salvo */
          pendingAdds = pendingAdds.map((a) =>
            a.id === blk.id
              ? { id: blk.id, inicio: blk.start.toISOString(), fim: blk.end.toISOString() }
              : a
          );
        } else {
          /* bloqueio já existente */
          const exists = pendingUpdates.find((u) => u.id === blk.id);
          if (exists) {
            pendingUpdates = pendingUpdates.map((u) =>
              u.id === blk.id ? { id: blk.id, inicio: blk.start.toISOString(), fim: blk.end.toISOString() } : u
            );
          } else {
            pendingUpdates.push({
              id: blk.id,
              inicio: blk.start.toISOString(),
              fim:    blk.end.toISOString(),
            });
          }
        }

        return {
          events: prev.events.map((e) => (e.id === blk.id ? blk : e)),
          active: blk,
          pendingAdds,
          pendingUpdates,
          debugData: { origem: "update", id: blk.id },
        };
      },
      () => this.pushToModel()
    );
  }

  handleRemove(blkId) {
    this.setState(
      (prev) => ({
        events: prev.events.filter((e) => e.id !== blkId),
        active: null,
        pendingRemoves: [...prev.pendingRemoves, blkId],
        debugData: { origem: "remove", id: blkId },
      }),
      () => this.pushToModel()
    );
  }

  handleSelect(blk) {
    this.setState({
      active: blk,
      debugData: { origem: "select", id: blk.id },
    });
  }
  /* -------------------------------- */

  /* ---------- render ---------- */
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
