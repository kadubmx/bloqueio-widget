/* src/App.jsx */
import React, { Component } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default class App extends Component {
  state = { events: [], active: null };

  /* ---------- UTIL ---------- */
  pushDebug(obj) {
    this.props.updateModel?.({ widgetDebug: obj });
  }

  loadEvents = () => {
    const raw =
      this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];

    const events = raw.map((ev) => ({
      ...ev,
      start:  new Date(ev.inicio),
      end:    new Date(ev.fim),
      title:
        ev.status_agendamento === "bloqueado"
          ? "Bloqueio"
          : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
    }));

    this.setState({
      events,
      active: events.find((e) => e.status === "bloqueado") || events[0],
    });
  };

  /* ---------- CICLO ---------- */
  componentDidMount()              { this.loadEvents(); }
  componentDidUpdate(p) {
    if (
      p.model?.getAgendaDia?.data !==
      this.props.model?.getAgendaDia?.data
    ) {
      this.loadEvents();
    }
  }

  /* ---------- CALLBACKS ---------- */
  handleSelect = (blk) => {
    this.setState({ active: blk }, () =>
      this.pushDebug({ tipo: "select", id: blk.id })
    );
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
      (s) => ({ events: [...s.events, novo], active: novo }),
      () => this.pushDebug({ tipo: "add", id: novo.id })
    );
  };

  /*  ⬇️  NÃO envia debug em todo movimento.
      Só depois que o usuário SOLTAR o bloqueio (mouse‑up)   */
  handleUpdate = (blk, finished = false) => {
    this.setState((s) => ({
      events: s.events.map((e) => (e.id === blk.id ? blk : e)),
      active: blk,
    }));
    if (finished) {
      this.pushDebug({
        tipo: "update",
        id: blk.id,
        start: blk.start.toISOString(),
        end: blk.end.toISOString(),
      });
    }
  };

  /* ---------- RENDER ---------- */
  render() {
    const { events, active } = this.state;
    if (!active) return null;

    return (
      <div style={{ padding: 20 }}>
        <h1>Bloqueios do Dia</h1>
        <p>{moment(active.start).format("HH:mm")} – {moment(active.end).format("HH:mm")}</p>

        <Timeline
          bookings={events.filter((e) => e.status !== "bloqueado")}
          blocks={events.filter((e) => e.status === "bloqueado")}
          active={active}
          onChange={(blk) => this.handleUpdate(blk, false)}
          onChangeEnd={(blk) => this.handleUpdate(blk, true)}
          onAdd={this.handleAdd}
          onSelect={this.handleSelect}
        />
      </div>
    );
  }
}
