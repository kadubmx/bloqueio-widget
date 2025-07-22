// src/App.jsx
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],        // lista atual de eventos + bloqueios
      active: null,      // bloqueio selecionado
      debugData: null,   // para exibir localmente
    };

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleAdd    = this.handleAdd.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  componentDidMount() {
    this.loadEvents();
  }

  componentDidUpdate(prevProps) {
    // só recarrega se os dados da query mudarem
    const before = prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
    const after  = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;
    if (before !== after) {
      this.loadEvents();
    }
  }

  loadEvents() {
    const data =
      this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];

    const parsed = data.map((ev) => ({
      ...ev,
      start:  new Date(ev.inicio),
      end:    new Date(ev.fim),
      title:
        ev.status_agendamento === "bloqueado"
          ? "Bloqueio"
          : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
      situacao: ev.status_agendamento,
      tipo: ev.tipo_atendimento,
      badge_bg: ev.badge_bg,
      badge_texto: ev.badge_texto,
    }));

    const firstBlock = parsed.find((e) => e.status === "bloqueado") || null;

    this.setState({
      events: parsed,
      active: firstBlock,
    });
  }

  handleUpdate(blk) {
    this.setState(
      (prev) => ({
        events: prev.events.map((e) =>
          e.id === blk.id ? blk : e
        ),
        active: blk,
        debugData: {
          origem: "update",
          id: blk.id,
          start: blk.start.toISOString(),
          end: blk.end.toISOString(),
        },
      })
    );
  }

  handleAdd(start, end) {
    const novo = {
      id: Date.now(),
      start,
      end,
      title: "Novo Bloqueio",
      status: "bloqueado",
    };

    this.setState((prev) => ({
      events: [...prev.events, novo],
      active: novo,
      debugData: {
        origem: "add",
        id: novo.id,
        start: novo.start.toISOString(),
        end: novo.end.toISOString(),
      },
    }));
  }

  handleSelect(blk) {
    this.setState({
      active: blk,
      debugData: {
        origem: "select",
        id: blk.id,
        start: blk.start.toISOString(),
        end: blk.end.toISOString(),
      },
    });
  }

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

        <div style={{ marginTop: 24, fontFamily: "monospace" }}>
          <h3>🔍 Debug local</h3>
          <pre style={{ background: "#f3f4f6", padding: 8 }}>
            {debugData
              ? JSON.stringify(debugData, null, 2)
              : "Nenhuma ação executada ainda."}
          </pre>
        </div>
      </div>
    );
  }
}
