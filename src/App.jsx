/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  state = {
    events: [],
    active: null,
    pendingAdds: [],
    pendingUpdates: [],
    pendingRemoves: [],
    debugData: null,
  };

  /* ---------- ciclo de vida ---------- */
  componentDidMount() {
    this.loadEvents();

    /* expõe método para botão externo (opcional) */
    if (typeof Lowcoder !== "undefined") {
      const WIDGET = "custom1";                // <‑‑ troque se seu widget tem outro nome
      Lowcoder[WIDGET] = Lowcoder[WIDGET] || {};
      Lowcoder[WIDGET].removeActive = () => {
        if (this.state.active) this.handleRemove(this.state.active.id);
      };
    }
  }

  componentDidUpdate(prevProps) {
    const beforeRaw =
      prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
    const afterRaw = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;

    if (JSON.stringify(beforeRaw || []) !== JSON.stringify(afterRaw || [])) {
      this.loadEvents();
    }
  }

  /* ---------- helpers ---------- */
  loadEvents = () => {
    const data =
      this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];

    const parsed = data.map((ev) => ({
      ...ev,
      start: new Date(ev.inicio),
      end: new Date(ev.fim),
      title:
        ev.status_agendamento === "bloqueado"
          ? "Bloqueio"
          : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
    }));

    this.setState({
      events: parsed,
      active: parsed.find((e) => e.status === "bloqueado") || null,
      pendingAdds: [],
      pendingUpdates: [],
      pendingRemoves: [],
    });
  };

  blkPayload = (b) => ({
    id: b.id,
    inicio: b.start.toISOString(),
    fim: b.end.toISOString(),
  });

  syncToModel = () => {
    const { updateModel } = this.props;
    if (!updateModel) return;
    const { pendingAdds, pendingUpdates, pendingRemoves } = this.state;
    updateModel({
      bloqueioWidget: {
        adds: pendingAdds,
        updates: pendingUpdates,
        removes: pendingRemoves,
      },
    });
  };

  /* ---------- callbacks ---------- */
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

        const inAdds = prev.pendingAdds.some((p) => p.id === blk.id);
        const inUpdates = prev.pendingUpdates.some((u) => u.id === blk.id);

        const adds = inAdds
          ? prev.pendingAdds.map((p) => (p.id === blk.id ? payload : p))
          : prev.pendingAdds;

        const updates = inAdds
          ? prev.pendingUpdates
          : inUpdates
          ? prev.pendingUpdates.map((u) => (u.id === blk.id ? payload : u))
          : [...prev.pendingUpdates, payload];

        return {
          events: prev.events.map((e) => (e.id === blk.id ? blk : e)),
          active: blk,
          pendingAdds: adds,
          pendingUpdates: updates,
          debugData: { origem: "update", id: blk.id },
        };
      },
      this.syncToModel
    );
  };

  handleSelect = (blk) => this.setState({ active: blk });

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

            {/* botão remover apenas quando for bloqueio */}
            {active.status === "bloqueado" && (
              <button
                onClick={() => this.handleRemove(active.id)}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  cursor: "pointer",
                  marginBottom: 6,
                }}
              >
                Remover bloqueio
              </button>
            )}
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

        <div style={{ marginTop: 24, fontFamily: "monospace" }}>
          <h4>Debug</h4>
          <pre style={{ background: "#f3f4f6", padding: 8 }}>
            {debugData ? JSON.stringify(debugData, null, 2) : "– nada –"}
          </pre>
        </div>
      </div>
    );
  }
}
