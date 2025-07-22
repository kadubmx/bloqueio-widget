/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { events: [], active: null };

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleAdd    = this.handleAdd.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  /* ——— envia dados de debug para o Lowcoder ——— */
  pushDebug(data) {
    if (this.props.updateModel) {
      this.props.updateModel({ widgetDebug: data });
    }
  }

  /* ——— carrega eventos vindos da query ——— */
  updateEvents() {
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

    const firstBlock =
      parsed.find((e) => e.status === "bloqueado") || parsed[0];

    this.setState({ events: parsed, active: firstBlock });
  }

  componentDidMount() {
    this.updateEvents();
  }

  componentDidUpdate(prevProps) {
    /* só recarrega se a LISTA DE EVENTOS mudar */
    const before = prevProps.model?.getAgendaDia?.data?.[0]?.result?.events;
    const after  = this.props.model?.getAgendaDia?.data?.[0]?.result?.events;
    if (before !== after) this.updateEvents();
  }

  /* ——— callbacks da Timeline ——— */
  handleUpdate(blk) {
    this.setState(
      (prev) => ({
        events: prev.events.map((e) =>
          e.id === blk.id ? blk : e
        ),
        active: blk,
      }),
      () => this.pushDebug({ origem: "update", blk })
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
    this.setState(
      (prev) => ({
        events: [...prev.events, novo],
        active: novo,
      }),
      () => this.pushDebug({ origem: "add", novo })
    );
  }

  handleSelect(blk) {
    this.setState({ active: blk }, () =>
      this.pushDebug({ origem: "select", blk })
    );
  }

  /* ——— render ——— */
  render() {
    const { events, active } = this.state;

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
      </div>
    );
  }
}
