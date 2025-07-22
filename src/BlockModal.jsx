import React, { useRef, useState } from "react";
import Timeline from "./Timeline";
import moment from "moment";

export default function BlockModal({
  block,
  events,
  onClose,
  onUpdate,
  onRemove,
  onAgendar,
}) {
  if (!block?.start || !block?.end) {
    return <div>Nenhum bloqueio selecionado</div>;
  }

  const initialBlocks = useRef(
    events.filter(
      (e) =>
        e.status === "bloqueado" &&
        e.start?.toDateString() === block.start.toDateString()
    )
  );

  const [workingBlocks, setWorkingBlocks] = useState(initialBlocks.current);
  const [draft, setDraft] = useState(block);

  const upsert = (blk) =>
    setWorkingBlocks((prev) =>
      prev.some((b) => b.id === blk.id)
        ? prev.map((b) => (b.id === blk.id ? blk : b))
        : [...prev, blk]
    );

  const handleSave = () => {
    workingBlocks.forEach(onUpdate);
    initialBlocks.current.forEach((orig) => {
      if (!workingBlocks.some((b) => b.id === orig.id)) onRemove(orig.id);
    });
    onClose();
  };

  const handleRemove = () => {
    setWorkingBlocks((prev) => {
      const next = prev.filter((b) => b.id !== draft.id);
      if (next.length) setDraft(next[0]);
      return next;
    });
  };

  const handleBloquearDiaTodo = () => {
    const dia = draft.start || block.start;
    const inicio = moment(dia).set({ hour: 6, minute: 0 }).toDate();
    const fim = moment(dia).set({ hour: 22, minute: 0 }).toDate();

    const novoBloqueio = {
      id: Date.now(),
      title: "Bloqueio",
      start: inicio,
      end: fim,
      status: "bloqueado",
    };

    setWorkingBlocks([novoBloqueio]);
    setDraft(novoBloqueio);
  };

  return (
    <div>
      <h3>Editar Bloqueios</h3>

      <p>
        {moment(draft.start).format("HH:mm")} –{" "}
        {moment(draft.end).format("HH:mm")}
      </p>

      <Timeline
        bookings={events.filter(
          (e) =>
            e.status === "pendente" &&
            e.start?.toDateString() === block.start.toDateString()
        )}
        blocks={workingBlocks}
        active={draft}
        onChange={(blk) => {
          setDraft(blk);
          upsert(blk);
        }}
        onAdd={(s, e) => {
          const novo = {
            id: Date.now() + Math.random(),
            title: "Bloqueio",
            start: s,
            end: e,
            status: "bloqueado",
          };
          upsert(novo);
          setDraft(novo);
        }}
        onSelect={(blk) => setDraft(blk)}
      />

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={handleSave}>Salvar</button>
        <button onClick={handleRemove}>Remover</button>
        <button onClick={onClose}>Cancelar</button>
        <button onClick={handleBloquearDiaTodo}>Bloquear Dia Todo</button>
      </div>
    </div>
  );
}
