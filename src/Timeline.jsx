import React, { useState, useEffect } from "react";

const SLOT = 15;
const DAY_MIN = 16 * 60;

export default function Timeline({
  bookings,
  blocks,
  active,
  onChange,
  onAdd,
  onSelect,
}) {
  const dayStart = new Date(active?.start || Date.now());
  dayStart.setHours(6, 0, 0, 0);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(int);
  }, []);

  const [sMin, setS] = useState((active?.start - dayStart) / 60000 || 0);
  const [eMin, setE] = useState((active?.end - dayStart) / 60000 || SLOT);

  useEffect(() => {
    if (!active) return;
    setS((active.start - dayStart) / 60000);
    setE((active.end - dayStart) / 60000);
  }, [active, dayStart]);

  const pct = m => (m / DAY_MIN) * 100;
  const snap = m => Math.round(m / SLOT) * SLOT;

  const clash = (s, e) =>
    bookings
      .concat(blocks.filter(b => b.id !== active?.id))
      .some(
        ev =>
          s < (ev.end - dayStart) / 60000 &&
          e > (ev.start - dayStart) / 60000
      );

  const propagate = (ns, ne) =>
    onChange({
      ...active,
      start: new Date(dayStart.getTime() + ns * 60000),
      end: new Date(dayStart.getTime() + ne * 60000),
    });

  const drag = edge => downEvt => {
    downEvt.preventDefault();
    const bar = downEvt.currentTarget.parentNode.parentNode;
    const move = mv => {
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

  const free = [];
  let cur = 0;
  [...bookings, ...blocks]
    .sort((a, b) => a.start - b.start)
    .forEach(ev => {
      const s = (ev.start - dayStart) / 60000;
      const e = (ev.end - dayStart) / 60000;
      if (s - cur >= SLOT) free.push({ from: cur, to: s });
      cur = Math.max(cur, e);
    });
  if (DAY_MIN - cur >= SLOT) free.push({ from: cur, to: DAY_MIN });

  const clickFree = slot => e => {
    const box = e.currentTarget.getBoundingClientRect();
    const off = ((e.clientX - box.left) / box.width) * (slot.to - slot.from);
    const minute = snap(slot.from + off);
    if (!clash(minute, minute + SLOT))
      onAdd(
        new Date(dayStart.getTime() + minute * 60000),
        new Date(dayStart.getTime() + (minute + SLOT) * 60000)
      );
  };

  return (
    <div className="timeline" style={{ position: "relative", height: "60px", background: "#f9fafb" }}>
      <div className="ruler" style={{ position: "absolute", top: -18, width: "100%" }}>
        {["06h00", "10h00", "14h00", "18h00", "22h00"].map((label, i) => (
          <span key={i} style={{
            position: "absolute",
            left: `${i * 25}%`,
            fontSize: "11px",
          }}>
            {label}
          </span>
        ))}
      </div>

      {bookings.map(b => (
        <div
          key={b.id}
          className="segment busy"
          style={{
            left: `${pct((b.start - dayStart) / 60000)}%`,
            width: `${pct((b.end - b.start) / 60000)}%`,
            position: "absolute",
            top: 0, bottom: 0,
            background: b.status === "pendente"
              ? "linear-gradient(135deg,#fef9c3,#fde68a)"
              : "linear-gradient(135deg,#bfdbfe,#93c5fd)"
          }}
        />
      ))}

      {blocks.map(blk => (
        <div
          key={blk.id}
          className={blk.id === active?.id ? "segment block active" : "segment block"}
          style={{
            left: `${pct((blk.start - dayStart) / 60000)}%`,
            width: `${pct((blk.end - blk.start) / 60000)}%`,
            position: "absolute",
            top: 0, bottom: 0,
            background: "linear-gradient(to right,#fecaca,#fca5a5)"
          }}
          onClick={() => onSelect(blk)}
        >
          {blk.id === active?.id && (
            <>
              <div className="handle left" onMouseDown={drag("start")}>⋮</div>
              <div className="handle right" onMouseDown={drag("end")}>⋮</div>
            </>
          )}
        </div>
      ))}

      {free.map((f, i) => (
        <div
          key={i}
          className="segment free"
          style={{
            left: `${pct(f.from)}%`,
            width: `${pct(f.to - f.from)}%`,
            position: "absolute",
            top: 0, bottom: 0,
            background: "#a7f3d0"
          }}
          onClick={clickFree(f)}
        />
      ))}

      <div
        className="current-time"
        style={{
          position: "absolute",
          top: 0, bottom: 0,
          width: "2px",
          background: "red",
          zIndex: 10,
          left: `${Math.max(0, Math.min(100, pct((now - dayStart.getTime()) / 60000)))}%`
        }}
      />
    </div>
  );
}
