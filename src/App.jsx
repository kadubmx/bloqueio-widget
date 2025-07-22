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
    };

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleAdd    = this.handleAdd.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  /* ========= Helpers de Debug para o Lowcoder ========== */
  pushDebug(data) {
    if (this.props.updateModel) {
      this.props.updateModel({ widgetDebug: data });
    }
  }
  /* ===================================================== */

  componentDidMount() {
    this.updateEvents();                    // carrega na primeira vez
  }

  componentDidUpdate(prevProps) {
    // se vier dado novo da query getAgendaDia → atualizar
    if (
      prevProps.model?.getAgendaDia?.data !==
      this.props.model?.getAgendaDia?.data
    ) {
      this.updateEvents();
    }
  }

  /* ---------- converte dados da query em eventos ---------- */
  updateEvents() {
    const { model } = this.props;
    const data =
      model?.getAgendaDia?.data?.[0]?.result?.events || [];

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

    /* envia para debug */
    this.pushDebug({
      origem: "updateEvents",
      totalEventos: parsed.length,
      activeId: firstBlock?.id || null,
    });
  }

  /* ======== callbacks da Timeline / Modal ======== */
  handleUpdate(blk) {
    this.setState(
      (prev) => ({
        events: prev.events.map((e) =>
          e.id === blk.id ? blk : e
        ),
        active: blk,
      }),
      () => {
        this.pushDebug({
          origem: "handleUpdate",
          evento: {
            id: blk.id,
            start: blk.start.toISOString(),
            end: blk.end.toISOString(),
          },
        });
      }
    );
  }

  handleAdd(start, end) {
    const newBlock = {
      id: Date.now(),
      start,
      end,
      title: "Novo Bloqueio",
      status: "bloqueado",
    };

    this.setState(
      (prev) => ({
        events: [...prev.events, newBlock],
        active: newBlock,
      }),
      () => {
        this.pushDebug({
          origem: "handleAdd",
          novo: {
            id: newBlock.id,
            start: start.toISOString(),
            end: end.toISOString(),
          },
        });
      }
    );
  }

  handleSelect(blk) {
    this.setState({ active: blk }, () => {
      this.pushDebug({
        origem: "handleSelect",
        selecionado: {
          id: blk.id,
          start: blk.start.toISOString(),
          end: blk.end.toISOString(),
        },
      });
    });
  }
  /* =============================================== */

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
