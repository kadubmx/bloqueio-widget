import React, { useState, useEffect } from "react";

const SLOT    = 15;           // minutos por slot
const DAY_MIN = 24 * 60;      // 6 h → 22 h  = 960 min

export default function Timeline({
  bookings = [],
  blocks   = [],
  active,
  onChange,
  onAdd,
  onSelect,
}) {
  /* ----------------------------------------------------------
     1. DATA-REFERÊNCIA (diaStart)
     ---------------------------------------------------------- */
  // procura o evento mais cedo (caso não haja bloqueio ativo)
  const allEvents   = [...bookings, ...blocks];
  const earliestEvt = allEvents.length
    ? allEvents.reduce(
        (earliest, ev) => (ev.start < earliest ? ev.start : earliest),
        allEvents[0].start
      )
    : null;

  const refDate = active?.start || earliestEvt || Date.now();

  // começa sempre às 00:00 desse dia
  const dayStart = new Date(refDate);
  dayStart.setHours(0, 0, 0, 0);

  /* ----------------------------------------------------------
     2. ESTADO LOCAL
     ---------------------------------------------------------- */
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60_000); // a cada min
    return () => clearInterval(int);
  }, []);

  const [sMin, setS] = useState(
    active ? (active.start - dayStart) / 60000 : 0
  );
  const [eMin, setE] = useState(
    active ? (active.end - dayStart) / 60000 : SLOT
  );

  useEffect(() => {
    if (!active) return;
    setS((active.start - dayStart) / 60000);
    setE((active.end - dayStart) / 60000);
  }, [active, dayStart]);

  /* ----------------------------------------------------------
     3. HELPERS
     ---------------------------------------------------------- */
  const pct  = (m) => (m / DAY_MIN) * 100;       // minutos → %
  const snap = (m) => Math.round(m / SLOT) * SLOT;

  const clash = (s, e) =>
    bookings
      .concat(blocks.filter((b) => b.id !== active?.id))
      .some(
        (ev) =>
          s < (ev.end   - dayStart) / 60000 &&
          e > (ev.start - dayStart) / 60000
      );

  const propagate = (ns, ne) =>
    onChange &&
    onChange({
      ...active,
      start: new Date(dayStart.getTime() + ns * 60000),
      end:   new Date(dayStart.getTime() + ne * 60000),
    });

  /* ----------------------------------------------------------
     4. DRAG-HANDLES (apenas se houver active)
     ---------------------------------------------------------- */
  const drag = (edge) => (downEvt) => {
    if (!active) return;            // segurança
    downEvt.preventDefault();
    const bar = downEvt.currentTarget.parentNode.parentNode;

    const move = (mv) => {
      const { left, width } = bar.getBoundingClientRect();
      const raw = ((mv.clientX - left) / width) * DAY_MIN;
      const pos = snap(Math.max(0, Math.min(DAY_MIN, raw)));

      if (edge === "start") {
        const ns = Math.min(pos, eMin - SLOT);
        if (!clash(ns, eMin)) {
          setS(ns);
          propagate(ns, eMin);
        }
      } else {
        const ne = Math.max(pos, sMin + SLOT);
        if (!clash(sMin, ne)) {
          setE(ne);
          propagate(sMin, ne);
        }
      }
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  /* ----------------------------------------------------------
     5. FAIXAS LIVRES (free) PARA CRIAR BLOQUEIO
     ---------------------------------------------------------- */
  const free = [];
  let cur = 0;
  allEvents
    .sort((a, b) => a.start - b.start)
    .forEach((ev) => {
      const s = (ev.start - dayStart) / 60000;
      const e = (ev.end   - dayStart) / 60000;
      if (s - cur >= SLOT) free.push({ from: cur, to: s });
      cur = Math.max(cur, e);
    });
  if (DAY_MIN - cur >= SLOT) free.push({ from: cur, to: DAY_MIN });

  const clickFree = (slot) => (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const off = ((e.clientX - box.left) / box.width) * (slot.to - slot.from);
    const minute = snap(slot.from + off);
    if (!clash(minute, minute + SLOT) && onAdd)
      onAdd(
        new Date(dayStart.getTime() + minute * 60000),
        new Date(dayStart.getTime() + (minute + SLOT) * 60000)
      );
  };

  /* ----------------------------------------------------------
     6. RÉGUA (labels a cada 4h)
     ---------------------------------------------------------- */
  const rulerMarks = Array.from({ length: 7 }, (_, i) => {
    const hour = i * 4;
    return {
      hour,
      percentage: pct(hour * 60),
      label: `${hour.toString().padStart(2, "0")}:00`,
    };
  });

  /* ----------------------------------------------------------
     7. RENDER
     ---------------------------------------------------------- */
  return (
    <div style={{ position: "relative", height: 80, background: "#f9fafb", marginTop: 30 }}>
      {/* Régua */}
      <div
        style={{
          position: "absolute",
          top: -30,
          width: "100%",
          height: 25,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {rulerMarks.map((mark, i) => (
          <div key={i} style={{ position: "absolute", left: `${mark.percentage}%` }}>
            <div
              style={{
                position: "absolute",
                left: -0.5,
                top: 15,
                width: 1,
                height: 10,
                background: "#6b7280",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translateX(-50%)",
                fontSize: 11,
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              {mark.label}
            </span>
          </div>
        ))}
      </div>

      {/* Linha do tempo */}
      <div style={{ position: "relative", height: 60, background: "#f9fafb" }}>
        {/* Agendamentos */}
        {bookings.map((b) => (
          <div
            key={b.id}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct((b.start - dayStart) / 60000)}%`,
              width: `${pct((b.end   - b.start) / 60000)}%`,
              background:
                b.status === "pendente"
                  ? "linear-gradient(135deg,#fef9c3,#fde68a)"
                  : "linear-gradient(135deg,#bfdbfe,#93c5fd)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 2,
            }}
          />
        ))}

        {/* Bloqueios */}
        {blocks.map((blk) => (
          <div
            key={blk.id}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct((blk.start - dayStart) / 60000)}%`,
              width: `${pct((blk.end   - blk.start) / 60000)}%`,
              background: "linear-gradient(to right,#fecaca,#fca5a5)",
              border: blk.id === active?.id ? "2px solid #dc2626" : "1px solid rgba(0,0,0,0.1)",
              borderRadius: 2,
              cursor: "pointer",
            }}
            onClick={() => onSelect && onSelect(blk)}
          >
            {blk.id === active?.id && (
              <>
                {/* Handle esquerdo */}
                <div
                  onMouseDown={drag("start")}
                  style={{
                    position: "absolute",
                    left: -3,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "ew-resize",
                    background: "#dc2626",
                    color: "#fff",
                    width: 6,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    borderRadius: 2,
                  }}
                >
                  ⋮
                </div>
                {/* Handle direito */}
                <div
                  onMouseDown={drag("end")}
                  style={{
                    position: "absolute",
                    right: -3,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "ew-resize",
                    background: "#dc2626",
                    color: "#fff",
                    width: 6,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    borderRadius: 2,
                  }}
                >
                  ⋮
                </div>
              </>
            )}
          </div>
        ))}

        {/* Faixas livres */}
        {free.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct(f.from)}%`,
              width: `${pct(f.to - f.from)}%`,
              background: "#a7f3d0",
              opacity: 0.7,
              cursor: "pointer",
              borderRadius: 2,
            }}
            onClick={clickFree(f)}
          />
        ))}

        {/* Linha do horário atual */}
        <div
          style={{
            position: "absolute",
            top: -5,
            bottom: -5,
            width: 2,
            left: `${Math.max(
              0,
              Math.min(100, pct((now - dayStart.getTime()) / 60000))
            )}%`,
            background: "#10b981",
            boxShadow: "0 0 4px rgba(16,185,129,0.5)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -3,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: 8,
              background: "#10b981",
              borderRadius: "50%",
              border: "2px solid #fff",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
