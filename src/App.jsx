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
  };

  componentDidMount() {
    this.loadEvents();
    this.setActiveFromModel();
  }

  componentDidUpdate(prevProps) {
    const before = JSON.stringify(prevProps.model?.getAgendaDia?.data);
    const after  = JSON.stringify(this.props.model?.getAgendaDia?.data);
    if (before !== after) this.loadEvents();
  }

  setActiveFromModel = () => {
    const m = this.props.customWidget?.model;

    const buildActive = ({ start, end }) => ({
      id: "from-model",
      start: moment.utc(start).local().toDate(),
      end:   moment.utc(end).local().toDate(),
      status: "bloqueado",
      title:  "Bloqueio Selecionado"
    });

    if (m?.bloqueioSelecionado) {
      const act = buildActive(m.bloqueioSelecionado);
      this.setState(prev => ({
        active: act,
        events: prev.events.some(e => e.id === act.id)
                  ? prev.events
                  : [...prev.events, act]
      }));
    } else if (m?.slotSelecionado) {
      const act = buildActive(m.slotSelecionado);
      this.setState(prev => ({
        active: act,
        events: prev.events.some(e => e.id === act.id)
                  ? prev.events
                  : [...prev.events, act]
      }));
    }
  };

  loadEvents = () => {
    const result = this.props.model?.getAgendaDia?.data?.[0]?.result || {};
    const data   = result.events || [];
    const slot   = result.slotSelecionado;

    const parsed = data.map(ev => ({
      ...ev,
      start : new Date(ev.inicio),
      end   : new Date(ev.fim),
      title : ev.status_agendamento === "bloqueado"
                ? "Bloqueio"
                : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
    }));

    let extraBlk = null;
    if (slot) {
      extraBlk = {
        id: "from-db",
        start: new Date(slot.start),
        end:   new Date(slot.end),
        status:"bloqueado",
        title: "Bloqueio Selecionado"
      };
    }

    const allEvents = extraBlk
      ? [...parsed, extraBlk]
      : parsed;

    const newActive = extraBlk
      ? extraBlk
      : parsed.find(e => e.status === "bloqueado") || this.state.active;

    this.setState({ events: allEvents, active: newActive });
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
        adds:    pendingAdds,
        updates: pendingUpdates,
        removes: pendingRemoves,
      },
    });
  };

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
      }),
      this.syncToModel
    );
  };

  handleUpdate = (blk) => {
    this.setState(
      (prev) => {
        const payload   = this.blkPayload(blk);
        const inAdds    = prev.pendingAdds.some(p => p.id === blk.id);
        const inUpdates = prev.pendingUpdates.some(u => u.id === blk.id);

        const adds = inAdds
          ? prev.pendingAdds.map(p => (p.id === blk.id ? payload : p))
          : prev.pendingAdds;

        const updates = inAdds
          ? prev.pendingUpdates
          : inUpdates
          ? prev.pendingUpdates.map(u => (u.id === blk.id ? payload : u))
          : [...prev.pendingUpdates, payload];

        return {
          events: prev.events.map(e => (e.id === blk.id ? blk : e)),
          active: blk,
          pendingAdds: adds,
          pendingUpdates: updates,
        };
      },
      this.syncToModel
    );
  };

  handleRemove = () => {
    this.setState(
      (prev) => {
        const { active, events, pendingAdds, pendingUpdates, pendingRemoves } = prev;
        if (!active) return {};

        const isSameEvent = (e) =>
          e.id === active.id ||
          (e.start.getTime() === active.start.getTime() &&
           e.end.getTime() === active.end.getTime());

        const target = events.find(isSameEvent);
        if (!target) return {};

        const isNew      = pendingAdds.some(p => p.id === target.id);
        const newAdds    = isNew ? pendingAdds.filter(p => p.id !== target.id) : pendingAdds;
        const newUpdates = pendingUpdates.filter(u => u.id !== target.id);
        const newRemoves = isNew ? pendingRemoves : [...pendingRemoves, target.id];

        const newEvents  = events.filter(e => !isSameEvent(e));
        const nextActive = newEvents.find(e => e.status === "bloqueado") || null;

        return {
          events: newEvents,
          active: nextActive,
          pendingAdds:    newAdds,
          pendingUpdates: newUpdates,
          pendingRemoves: newRemoves
        };
      },
      this.syncToModel
    );
  };

  handleSelect = blk => this.setState({ active: blk });

  formatTime = (date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  render() {
    const { events, active } = this.state;

    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        {active && (
          <div
            style={{
              marginBottom: 20,
              padding: 15,
              background: "#f3f4f6",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ color: "#374151", margin: "0 0 10px" }}>
              Editar Bloqueio
            </h3>
            <p style={{ margin: "0 0 10px", color: "#6b7280" }}>
              {this.formatTime(active.start)} – {this.formatTime(active.end)}
            </p>
            <button
              onClick={this.handleRemove}
              disabled={!active}
              style={{
                background: active ? "#dc2626" : "#fca5a5",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                cursor: active ? "pointer" : "not-allowed",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Remover este bloqueio
            </button>
          </div>
        )}

        {events.length > 0 && (
          <Timeline
            bookings={events.filter((e) => e.status !== "bloqueado")}
            blocks={events.filter((e) => e.status === "bloqueado")}
            active={active}
            onChange={this.handleUpdate}
            onAdd={this.handleAdd}
            onSelect={this.handleSelect}
          />
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: "#6b7280" }}>
          <p>
            •{" "}
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#a7f3d0",
                marginRight: 8,
              }}
            ></span>
            Clique nos horários livres (verde) para criar bloqueios
          </p>
          <p>
            •{" "}
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background:
                  "linear-gradient(to right,#fecaca,#fca5a5)",
                marginRight: 8,
              }}
            ></span>
            Bloqueios podem ser redimensionados arrastando as bordas
          </p>
          <p>
            •{" "}
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 12,
                background: "#10b981",
                marginRight: 10,
              }}
            ></span>
            Linha verde indica o horário atual
          </p>
        </div>
      </div>
    );
  }
}
