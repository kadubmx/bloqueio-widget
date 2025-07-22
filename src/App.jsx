import React, { useEffect, useState } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default function App({ model, updateModel, runQuery }) {
  const [events, setEvents] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    console.log("Model recebido:", model); // Debug
    
    const data = model?.getAgendaDia?.data?.[0]?.result?.events || [];
    console.log("Dados extraídos:", data); // Debug
    
    const parsed = data.map(ev => ({
      ...ev,
      start: new Date(ev.inicio),
      end: new Date(ev.fim),
      title: ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
      situacao: ev.status_agendamento,
      tipo: ev.tipo_atendimento,
      badge_bg: ev.badge_bg,
      badge_texto: ev.badge_texto,
    }));

    setEvents(parsed);

    const firstBlock =
      parsed.find(e => e.status === "bloqueado") || parsed[0];
    setActive(firstBlock);
  }, [model?.getAgendaDia?.data]);

  const handleUpdate = blk => {
    setEvents(prev =>
      prev.map(e => (e.id === blk.id ? blk : e))
    );
    setActive(blk);
  };

  const handleAdd = (start, end) => {
    const newBlock = {
      id: Date.now(),
      start,
      end,
      title: "Novo Bloqueio",
      status: "bloqueado",
    };
    setEvents(prev => [...prev, newBlock]);
    setActive(newBlock);
  };

  const handleSelect = blk => {
    setActive(blk);
  };

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
          bookings={events.filter(e => e.status !== "bloqueado")}
          blocks={events.filter(e => e.status === "bloqueado")}
          active={active}
          onChange={handleUpdate}
          onAdd={handleAdd}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}