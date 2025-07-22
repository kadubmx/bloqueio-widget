import React, { Component } from "react";
import Timeline from "./Timeline";

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
  }

  componentDidUpdate(prevProps) {
    const before = JSON.stringify(prevProps.model?.getAgendaDia?.data);
    const after = JSON.stringify(this.props.model?.getAgendaDia?.data);
    if (before !== after) this.loadEvents();
  }

  loadEvents = () => {
    const data = this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];
    const parsed = data.map((ev) => ({
      ...ev,
      start: new Date(ev.inicio),
      end: new Date(ev.fim),
      title: ev.status_agendamento === "bloqueado" ? "Bloqueio" : ev.nome_paciente || ev.status_agendamento || "Evento",
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
        const payload = this.blkPayload(blk);
        const inAdds = prev.pendingAdds.some((p) => p.id === blk.id);
        const inUpdates = prev.pendingUpdates.some((u) => u.id === blk.id);

        const adds = inAdds ? prev.pendingAdds.map((p) => (p.id === blk.id ? payload : p)) : prev.pendingAdds;
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
        };
      },
      this.syncToModel
    );
  };

  handleSelect = (blk) => {
    this.setState({ active: blk });
  };

  handleRemove = () => {
    this.setState(
      (prev) => {
        const { active, events, pendingRemoves } = prev;
        const newEvents = events.filter((e) => e.id !== active.id);
        const nextActive = newEvents.find((e) => e.status === "bloqueado") || null;
        return {
          events: newEvents,
          active: nextActive,
          pendingRemoves: [...pendingRemoves, active.id],
        };
      },
      this.syncToModel
    );
  };

  formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  render() {
    const { events, active } = this.state;

    return (
      <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>Bloqueios do Dia</h1>

        {active && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: '0 0 10px 0' }}>Editar Bloqueio</h3>
            <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
              {this.formatTime(active.start)} – {this.formatTime(active.end)}
            </p>
            <button
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500"
              }}
              onClick={this.handleRemove}
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

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
          <p>• <span style={{display: 'inline-block', width: '12px', height: '12px', background: '#a7f3d0', marginRight: '8px'}}></span>Clique nos horários livres (verde) para criar bloqueios</p>
          <p>• <span style={{display: 'inline-block', width: '12px', height: '12px', background: 'linear-gradient(to right,#fecaca,#fca5a5)', marginRight: '8px'}}></span>Bloqueios podem ser redimensionados arrastando as bordas</p>
          <p>• <span style={{display: 'inline-block', width: '2px', height: '12px', background: '#10b981', marginRight: '10px'}}></span>Linha verde indica o horário atual</p>
        </div>
      </div>
    );
  }
}