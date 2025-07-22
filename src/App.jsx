import React, { useEffect, useState } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default function App({ model, updateModel, runQuery }) {
  const [events, setEvents] = useState([]);
  const [active, setActive] = useState(null);

  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [pendingRemoves, setPendingRemoves] = useState([]);
  const [pendingAdds, setPendingAdds] = useState([]);

  // quando chega dado do Lowcoder
  useEffect(() => {
    const data = model.getAgendaDia?.data?.[0]?.result;

    if (!data?.events) return;

    const parsed = data.events.map((ev) => ({
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
      parsed.find((e) => e.status === "bloqueado") || parsed[0];
    setActive(firstBlock);

    // limpa alterações pendentes (opcional)
    setPendingAdds([]);
    setPendingUpdates([]);
    setPendingRemoves([]);
  }, [model.getAgendaDia]);

  const handleUpdate = (blk) => {
    setEvents((prev) => prev.map((e) => (e.id === blk.id ? blk : e)));
    setActive(blk);

    setPendingUpdates((prev) => {
      const exists = prev.find((p) => p.id === blk.id);
      const data = { id: blk.id, start: blk.start, end: blk.end };
      if (exists) {
        return prev.map((p) => (p.id === blk.id ? data : p));
      } else {
        return [...prev, data];
      }
    });

    notifyLowcoder();
  };

  const handleAdd = (start, end) => {
    const newBlock = {
      id: Date.now(),
      start,
      end,
      title: "Novo Bloqueio",
      status: "bloqueado",
    };
    setEvents((prev) => [...prev, newBlock]);
    setActive(newBlock);
    setPendingAdds((prev) => [...prev, newBlock]);

    notifyLowcoder();
  };

  const handleSelect = (blk) => {
    setActive(blk);
  };

  const handleRemove = () => {
    if (!active) return;
    setEvents((prev) => prev.filter((e) => e.id !== active.id));
    setPendingRemoves((prev) => [...prev, active.id]);
    setActive(null);

    notifyLowcoder();
  };

  const formatBlock = (b) => ({
    id: b.id,
    start: moment(b.start).utcOffset(-3).format(),
    end: moment(b.end).utcOffset(-3).format(),
  });

  const notifyLowcoder = () => {
    updateModel({
      bloqueiosPendentes: {
        updates: pendingUpdates.map(formatBlock),
        adds: pendingAdds.map(formatBlock),
        removes: pendingRemoves,
      },
    });
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
          bookings={events.filter((e) => e.status !== "bloqueado")}
          blocks={events.filter((e) => e.status === "bloqueado")}
          active={active}
          onChange={handleUpdate}
          onAdd={handleAdd}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
