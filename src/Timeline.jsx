import React, { useState, useEffect } from "react";

const SLOT = 15;
const DAY_MIN = 16 * 60; // 16h no total (6h às 22h)

export default function Timeline({
  bookings,
  blocks,
  active,
  onChange,
  onAdd,
  onSelect,
}) {
  const fallbackStart = new Date();
  fallbackStart.setHours(6, 0, 0, 0);

  const dayStart = new Date(active?.start || fallbackStart);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000);
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

  const pct = (m) => (m / DAY_MIN) * 100;
  const snap = (m) => Math.round(m / SLOT) * SLOT;

  const clash = (s, e) =>
    bookings
      .concat(blocks.filter((b) => b.id !== active?.id))
      .some(
        (ev) =>
          s < (ev.end - dayStart) / 60000 &&
          e > (ev.start - dayStart) / 60000
      );

  const propagate = (ns, ne) =>
    onChange &&
    onChange({
      ...active,
      start: new Date(dayStart.getTime() + ns * 60000),
      end: new Date(dayStart.getTime() + ne * 60000),
    });

  const drag = (edge) => (downEvt) => {
    if (!active) return;
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

  const free = [];
  let cur = 0;
  [...bookings, ...blocks]
    .sort((a, b) => a.start - b.start)
    .forEach((ev) => {
      const s = (ev.start - dayStart) / 60000;
      const e = (ev.end - dayStart) / 60000;
      if (s - cur >= SLOT) free.push({ from: cur, to: s });
      cur = Math.max(cur, e);
    });
  if (DAY_MIN - cur >= SLOT) free.push({ from: cur, to: DAY_MIN });

  const clickFree = (slot) => (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const off = ((e.clientX - box.left) / box.width) * (slot.to - slot.from);
    const minute = snap(slot.from + off);
    if (!clash(minute, minute + SLOT))
      onAdd &&
        onAdd(
          new Date(dayStart.getTime() + minute * 60000),
          new Date(dayStart.getTime() + (minute + SLOT) * 60000)
        );
  };

  const generateRulerMarks = () => {
    const marks = [];
    for (let hour = 6; hour <= 22; hour += 4) {
      const minutes = (hour - 6) * 60;
      const percentage = pct(minutes);
      marks.push({
        hour,
        percentage,
        label: `${hour.toString().padStart(2, "0")}:00`,
      });
    }
    return marks;
  };

  const rulerMarks = generateRulerMarks();

  return (
    <div style={{ position: "relative", height: "80px", background: "#f9fafb", marginTop: "30px" }}>
      <div
        className="ruler"
        style={{
          position: "absolute",
          top: "-30px",
          width: "100%",
          height: "25px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {rulerMarks.map((mark, i) => (
          <div key={i} style={{ position: "absolute", left: `${mark.percentage}%` }}>
            <div
              style={{
                position: "absolute",
                left: "-0.5px",
                top: "15px",
                width: "1px",
                height: "10px",
                background: "#6b7280",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "0px",
                transform: "translateX(-50%)",
                fontSize: "11px",
                color: "#6b7280",
                fontWeight: "500",
              }}
            >
              {mark.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="timeline"
        style={{ position: "relative", height: "60px", background: "#f9fafb" }}
      >
        {bookings.map((b) => (
          <div
            key={b.id}
            className="segment busy"
            style={{
              left: `${pct((b.start - dayStart) / 60000)}%`,
              width: `${pct((b.end - b.start) / 60000)}%`,
              position: "absolute",
              top: 0,
              bottom: 0,
              background:
                b.status === "pendente"
                  ? "linear-gradient(135deg,#fef9c3,#fde68a)"
                  : "linear-gradient(135deg,#bfdbfe,#93c5fd)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "2px",
            }}
          />
        ))}

        {blocks.map((blk) => (
          <div
            key={blk.id}
            className={blk.id === active?.id ? "segment block active" : "segment block"}
            style={{
              left: `${pct((blk.start - dayStart) / 60000)}%`,
              width: `${pct((blk.end - blk.start) / 60000)}%`,
              position: "absolute",
              top: 0,
              bottom: 0,
              background: "linear-gradient(to right,#fecaca,#fca5a5)",
              border: blk.id === active?.id ? "2px solid #dc2626" : "1px solid rgba(0,0,0,0.1)",
              borderRadius: "2px",
              cursor: "pointer",
            }}
            onClick={() => onSelect && onSelect(blk)}
          >
            {blk.id === active?.id && (
              <>
                <div
                  className="handle left"
                  onMouseDown={drag("start")}
                  style={{
                    position: "absolute",
                    left: "-3px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "ew-resize",
                    background: "#dc2626",
                    color: "white",
                    width: "6px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    borderRadius: "2px",
                  }}
                >
                  ⋮
                </div>
                <div
                  className="handle right"
                  onMouseDown={drag("end")}
                  style={{
                    position: "absolute",
                    right: "-3px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "ew-resize",
                    background: "#dc2626",
                    color: "white",
                    width: "6px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    borderRadius: "2px",
                  }}
                >
                  ⋮
                </div>
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
              top: 0,
              bottom: 0,
              background: "#a7f3d0",
              cursor: "pointer",
              opacity: 0.7,
              borderRadius: "2px",
            }}
            onClick={clickFree(f)}
          />
        ))}

        <div
          className="current-time"
          style={{
            position: "absolute",
            top: "-5px",
            bottom: "-5px",
            width: "2px",
            background: "#10b981",
            zIndex: 10,
            left: `${Math.max(
              0,
              Math.min(100, pct((now - dayStart.getTime()) / 60000))
            )}%`,
            boxShadow: "0 0 4px rgba(16, 185, 129, 0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-3px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "8px",
              height: "8px",
              background: "#10b981",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
