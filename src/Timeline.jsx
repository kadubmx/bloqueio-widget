import React, { useState, useEffect, Component } from "react";

const SLOT = 15;
const DAY_MIN = 16 * 60; // 16 horas (6h às 22h)

// Componente Timeline melhorado
function Timeline({
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

  // Função para gerar as marcações da régua (a cada 4 horas)
  const generateRulerMarks = () => {
    const marks = [];
    // Começando às 6h, marcando a cada 4 horas: 6h, 10h, 14h, 18h, 22h
    for (let hour = 6; hour <= 22; hour += 4) {
      const minutes = (hour - 6) * 60; // Minutos desde 6h
      const percentage = pct(minutes);
      marks.push({
        hour,
        percentage,
        label: `${hour.toString().padStart(2, '0')}:00`
      });
    }
    return marks;
  };

  const rulerMarks = generateRulerMarks();

  return (
    <div style={{ position: "relative", height: "80px", background: "#f9fafb", marginTop: "30px" }}>
      {/* Régua com marcações a cada 4 horas */}
      <div 
        className="ruler" 
        style={{ 
          position: "absolute", 
          top: "-30px", 
          width: "100%", 
          height: "25px",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        {rulerMarks.map((mark, i) => (
          <div key={i} style={{ position: "absolute", left: `${mark.percentage}%` }}>
            {/* Linha vertical da marcação */}
            <div 
              style={{
                position: "absolute",
                left: "-0.5px",
                top: "15px",
                width: "1px",
                height: "10px",
                background: "#6b7280"
              }}
            />
            {/* Label do horário */}
            <span 
              style={{
                position: "absolute",
                left: "50%",
                top: "0px",
                transform: "translateX(-50%)",
                fontSize: "11px",
                color: "#6b7280",
                fontWeight: "500"
              }}
            >
              {mark.label}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline principal */}
      <div className="timeline" style={{ position: "relative", height: "60px", background: "#f9fafb" }}>
        
        {/* Agendamentos existentes */}
        {bookings.map(b => (
          <div
            key={b.id}
            className="segment busy"
            style={{
              left: `${pct((b.start - dayStart) / 60000)}%`,
              width: `${pct((b.end - b.start) / 60000)}%`,
              position: "absolute",
              top: 0, 
              bottom: 0,
              background: b.status === "pendente"
                ? "linear-gradient(135deg,#fef9c3,#fde68a)"
                : "linear-gradient(135deg,#bfdbfe,#93c5fd)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "2px"
            }}
          />
        ))}

        {/* Bloqueios */}
        {blocks.map(blk => (
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
              cursor: "pointer"
            }}
            onClick={() => onSelect(blk)}
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
                    borderRadius: "2px"
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
                    borderRadius: "2px"
                  }}
                >
                  ⋮
                </div>
              </>
            )}
          </div>
        ))}

        {/* Horários livres */}
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
              borderRadius: "2px"
            }}
            onClick={clickFree(f)}
          />
        ))}

        {/* Linha verde do horário atual */}
        <div
          className="current-time"
          style={{
            position: "absolute",
            top: "-5px",
            bottom: "-5px",
            width: "2px",
            background: "#10b981",
            zIndex: 10,
            left: `${Math.max(0, Math.min(100, pct((now - dayStart.getTime()) / 60000)))}%`,
            boxShadow: "0 0 4px rgba(16, 185, 129, 0.5)"
          }}
        >
          {/* Indicador no topo da linha */}
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
              boxShadow: "0 0 4px rgba(0,0,0,0.2)"
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Componente App principal - retomando fonte de dados original
class App extends Component {
  state = {
    events: [],
    active: null,
    pendingAdds: [],
    pendingUpdates: [],
    pendingRemoves: [],
  };

  componentDidMount() {
    this.loadEvents();
  }

  componentDidUpdate(prevProps) {
    const before = JSON.stringify(prevProps.model?.getAgendaDia?.data);
    const after = JSON.stringify(this.props.model?.getAgendaDia?.data);
    if (before !== after) this.loadEvents();
  }

  loadEvents = () => {
    const data = this.props.model?.getAgendaDia?.data?.[0]?.result?.events || [];
    const parsed = data.map((ev) => ({
      ...ev,
      start: new Date(ev.inicio),
      end: new Date(ev.fim),
      title: ev.status_agendamento === "bloqueado" ? "Bloqueio" : ev.nome_paciente || ev.status_agendamento || "Evento",
      status: ev.status_agendamento,
    }));

    this.setState({
      events: parsed,
      active: parsed.find((e) => e.status === "bloqueado") || null,
      pendingAdds: [],
      pendingUpdates: [],
      pendingRemoves: [],
    });
  };

  blkPayload = (b) => ({
    id: b.id,
    inicio: b.start.toISOString(),
    fim: b.end.toISOString(),
  });

  syncToModel = () => {
    const { updateModel } = this.props;
    if (!updateModel) return;
    const { pendingAdds, pendingUpdates, pendingRemoves } = this.state;
    updateModel({
      bloqueioWidget: {
        adds: pendingAdds,
        updates: pendingUpdates,
        removes: pendingRemoves,
      },
    });
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
      (prev) => ({
        events: [...prev.events, novo],
        active: novo,
        pendingAdds: [...prev.pendingAdds, this.blkPayload(novo)],
      }),
      this.syncToModel
    );
  };

  handleUpdate = (blk) => {
    this.setState(
      (prev) => {
        const payload = this.blkPayload(blk);
        const inAdds = prev.pendingAdds.some((p) => p.id === blk.id);
        const inUpdates = prev.pendingUpdates.some((u) => u.id === blk.id);

        const adds = inAdds ? prev.pendingAdds.map((p) => (p.id === blk.id ? payload : p)) : prev.pendingAdds;
        const updates = inAdds
          ? prev.pendingUpdates
          : inUpdates
          ? prev.pendingUpdates.map((u) => (u.id === blk.id ? payload : u))
          : [...prev.pendingUpdates, payload];

        return {
          events: prev.events.map((e) => (e.id === blk.id ? blk : e)),
          active: blk,
          pendingAdds: adds,
          pendingUpdates: updates,
        };
      },
      this.syncToModel
    );
  };

  handleSelect = (blk) => {
    this.setState({ active: blk });
  };

  handleRemove = () => {
    this.setState(
      (prev) => {
        const { active, events, pendingRemoves } = prev;
        const newEvents = events.filter((e) => e.id !== active.id);
        const nextActive = newEvents.find((e) => e.status === "bloqueado") || null;
        return {
          events: newEvents,
          active: nextActive,
          pendingRemoves: [...pendingRemoves, active.id],
        };
      },
      this.syncToModel
    );
  };

  formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  render() {
    const { events, active } = this.state;

    return (
      <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>Bloqueios do Dia</h1>

        {active && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            background: '#f3f4f6', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: '0 0 10px 0' }}>Editar Bloqueio</h3>
            <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
              {this.formatTime(active.start)} – {this.formatTime(active.end)}
            </p>
            <button
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500"
              }}
              onClick={this.handleRemove}
            >
              Remover este bloqueio
            </button>
          </div>
        )}

        {events.length > 0 && (
          <Timeline
            bookings={events.filter((e) => e.status !== "bloqueado")}
            blocks={events.filter((e) => e.status === "bloqueado")}
            active={active}
            onChange={this.handleUpdate}
            onAdd={this.handleAdd}
            onSelect={this.handleSelect}
          />
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
          <p>• <span style={{display: 'inline-block', width: '12px', height: '12px', background: '#a7f3d0', marginRight: '8px'}}></span>Clique nos horários livres (verde) para criar bloqueios</p>
          <p>• <span style={{display: 'inline-block', width: '12px', height: '12px', background: 'linear-gradient(to right,#fecaca,#fca5a5)', marginRight: '8px'}}></span>Bloqueios podem ser redimensionados arrastando as bordas</p>
          <p>• <span style={{display: 'inline-block', width: '2px', height: '12px', background: '#10b981', marginRight: '10px'}}></span>Linha verde indica o horário atual</p>
        </div>
      </div>
    );
  }
}

export default App;