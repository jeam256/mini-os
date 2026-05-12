import { useCallback, useEffect, useRef, useState } from "react";
import {
  APP_ICONS,
  MEMORY_MAX,
  PROCESS_STATES,
  SCHEDULING_ALGORITHMS,
  addWindow,
  buildSystemSnapshot,
  createInitialState,
  executeCommand,
  moveWindow,
  tickScheduler,
} from "./system";

// ================================
// COMPONENTES AUXILIARES
// ================================

function ProcessCard({ process, isRunning }) {
  const statusColors = {
    [PROCESS_STATES.NEW]: "bg-gray-600",
    [PROCESS_STATES.READY]: "bg-blue-500",
    [PROCESS_STATES.RUNNING]: "bg-green-500",
    [PROCESS_STATES.WAITING]: "bg-yellow-500",
    [PROCESS_STATES.TERMINATED]: "bg-red-600",
  };

  const algoDisplay = process.algoritmo === SCHEDULING_ALGORITHMS.ROUND_ROBIN ? "RR" : "FIFO";
  const tiempoDisplay = process.infinito ? `${process.tiempo}/∞` : `${process.tiempo}/${process.duracion}s`;

  return (
    <div className={`process-card ${statusColors[process.estado]} ${isRunning ? "running" : ""}`}>
      <div className="process-header">
        <span className="process-name">{process.nombre}</span>
        <span className="process-id">{process.id.substring(0, 6)}</span>
      </div>
      <div className="process-info">
        <div>Estado: {process.estado}</div>
        <div>Algoritmo: {algoDisplay}</div>
        <div>Tiempo: {tiempoDisplay}</div>
        {process.bloqueadoPor && (
          <div style={{ color: "#fbbf24", fontWeight: 600 }}>⏸ Esperando: {process.bloqueadoPor}</div>
        )}
      </div>
    </div>
  );
}

function MemoryBar({ used, max }) {
  const percentage = (used / max) * 100;
  const color = percentage >= 80 ? "rgba(239,68,68,0.8)" : percentage >= 60 ? "rgba(245,158,11,0.8)" : undefined;
  return (
    <div className="memory-container">
      <div className="memory-label">
        Memoria: {used}/{max} MB ({Math.round(percentage)}%)
      </div>
      <div className="memory-bar">
        <div className="memory-used" style={{ width: `${percentage}%`, ...(color ? { background: color } : {}) }} />
      </div>
    </div>
  );
}

function CPUStatus({ process }) {
  if (!process) {
    return (
      <div className="cpu-status idle">
        <div className="cpu-icon">⏸</div>
        <div className="cpu-text">CPU: Idle</div>
      </div>
    );
  }
  const progress = process.infinito ? 100 : (process.tiempo / process.duracion) * 100;
  return (
    <div className="cpu-status running">
      <div className="cpu-icon">▶</div>
      <div className="cpu-info">
        <div className="cpu-name">{process.nombre}</div>
        <div className="cpu-bar">
          <div className="cpu-progress" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// Panel de semáforos y mutex
function SyncPanel({ semaforos }) {
  const keys = Object.keys(semaforos);
  if (keys.length === 0) {
    return <p className="empty-text">Sin semáforos ni mutex activos</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {keys.map((key) => {
        const s = semaforos[key];
        const esMutex = s.tipo === "mutex";
        const libre = s.valor > 0;

        return (
          <div
            key={key}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: libre ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${libre ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong style={{ color: esMutex ? "#c4b5fd" : "#93c5fd" }}>
                {esMutex ? "🔐 MUTEX" : "🚦 SEM"} {s.nombre}
              </strong>
              <span style={{ color: libre ? "#86efac" : "#fca5a5" }}>
                {libre ? "LIBRE 🟢" : "OCUPADO 🔴"}
              </span>
            </div>
            <div style={{ color: "#94a3b8" }}>
              Valor: {s.valor}/{s.maxValor}
              {esMutex && s.dueno && <span> · Dueño: <strong style={{ color: "#fcd34d" }}>{s.dueno}</strong></span>}
            </div>
            {s.esperando.length > 0 && (
              <div style={{ color: "#fbbf24", marginTop: 4 }}>
                ⏸ Esperando: [{s.esperando.join(", ")}]
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ================================
// COMPONENTE PRINCIPAL
// ================================

function App() {
  const [systemState, setSystemState] = useState(createInitialState);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState({ loading: false, error: null, result: null });
  const terminalBodyRef = useRef(null);

  useEffect(() => {
    const node = terminalBodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [systemState.logs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSystemState((current) => tickScheduler(current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const analyzeWithAI = useCallback(async () => {
    setAiState((s) => ({ ...s, loading: true, error: null }));

    setSystemState((current) => {
      const snapshot = buildSystemSnapshot(current);

      const prompt = `Responde ÚNICAMENTE con JSON válido, sin texto extra, sin markdown.

Estado actual del sistema operativo:
${JSON.stringify(snapshot, null, 2)}

Analiza el sistema y responde con este JSON exacto:
{
  "alerta": "describe un problema concreto si existe, o null",
  "sugerencia": "consejo sobre memoria o CPU, o null",
  "recomendacion": "recomendación sobre algoritmos de planificación",
  "acciones": []
}

Reglas:
- "alerta": solo si memoria supera 80%, hay más de 6 procesos, o hay procesos bloqueados en deadlock
- "sugerencia": consejo útil o null
- "recomendacion": analiza algoritmos:
  * Todos FIFO y más de 3 procesos → recomienda Round Robin
  * Todos RR con pocos procesos → recomienda FIFO
  * Procesos en WAITING → comenta sobre la sincronización
  * Sin procesos → "Sin procesos activos"
- "acciones": siempre []
- Responde SOLO el JSON`;

      fetch("http://localhost:3001/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const text = data.choices?.[0]?.message?.content ?? "{}";
          const clean = text.replace(/```json|```/g, "").trim();
          let result;
          try {
            result = JSON.parse(clean);
          } catch {
            result = { alerta: null, sugerencia: text, recomendacion: null, acciones: [] };
          }
          setAiState({ loading: false, error: null, result });
        })
        .catch(() => {
          setAiState({ loading: false, error: "No se pudo conectar. ¿Está corriendo node server.js?", result: null });
        });

      return current;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemState((current) => {
        if (current.procesos.length > 0) analyzeWithAI();
        return current;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [analyzeWithAI]);

  function handleSubmit(event) {
    event.preventDefault();
    const rawCommand = input.trim();
    if (rawCommand) setSystemState((current) => executeCommand(current, rawCommand));
    setInput("");
  }

  function handleOpenItem(item) {
    setSystemState((current) => {
      if (item.type === "app") return executeCommand(current, `ejecutar ${item.id}`);
      return { ...current, windows: addWindow(current.windows, item) };
    });
  }

  function moveWindowItem(id, x, y) {
    setSystemState((current) => ({ ...current, windows: moveWindow(current.windows, id, x, y) }));
  }

  function closeWindow(id) {
    setSystemState((current) => ({ ...current, windows: current.windows.filter((w) => w.id !== id) }));
  }

  function handleMouseDown(e, windowItem) {
    const startX = e.clientX - windowItem.x;
    const startY = e.clientY - windowItem.y;
    function onMouseMove(e) { moveWindowItem(windowItem.id, e.clientX - startX, e.clientY - startY); }
    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  const readyItems = systemState.colaReady.filter((p) => p.estado !== PROCESS_STATES.WAITING).length;
  const waitingItems = systemState.procesos.filter((p) => p.estado === PROCESS_STATES.WAITING).length;
  const runningItem = systemState.cpuProceso?.nombre ?? "Ninguno";

  return (
    <main className="app-shell">
      {/* ── Terminal ── */}
      <section className="terminal-pane">
        <div className="panel-header">
          <span className="panel-title">{APP_ICONS.terminal} Terminal</span>
          <span className="panel-pill">Mini OS v2.0</span>
        </div>

        <div className="terminal-body" ref={terminalBodyRef}>
          {systemState.logs.map((line, index) => (
            <div className="terminal-line" key={`${line}-${index}`}>{line}</div>
          ))}
        </div>

        <form className="terminal-input-row" onSubmit={handleSubmit}>
          <span className="prompt">MiSO {systemState.directorioActual}&gt;</span>
          <input
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ayuda para ver comandos..."
            autoFocus
          />
        </form>
      </section>

      {/* ── Desktop ── */}
      <section className="desktop-pane">
        <div className="desktop-topbar">
          <div className="status-chip">
            {APP_ICONS.chrome} {systemState.appsActivas.length} apps · 📁 {systemState.directorioActual}
          </div>
          <div className="status-clock">{systemState.hora}</div>
        </div>

        <div className="desktop-content">
          <aside className="desktop-icons">
            {systemState.desktopItems.map((item) => (
              <button className="desktop-icon" key={item.id} onDoubleClick={() => handleOpenItem(item)}>
                <span className="desktop-icon-glyph">{item.icon}</span>
                <span className="desktop-icon-label">{item.label}</span>
              </button>
            ))}
          </aside>

          <section className="system-panel">
            <div className="system-card">
              <h3>CPU</h3>
              <CPUStatus process={systemState.cpuProceso} />
            </div>

            <div className="system-card">
              <h3>Memoria</h3>
              <MemoryBar used={systemState.memoria} max={MEMORY_MAX} />
            </div>

            <div className="system-card">
              <h3>Estado del Sistema</h3>
              <div className="system-stats">
                <div className="stat-row">
                  <span>Procesos totales:</span>
                  <strong>{systemState.procesos.length}</strong>
                </div>
                <div className="stat-row">
                  <span>En Ready:</span>
                  <strong className="ready">{readyItems}</strong>
                </div>
                <div className="stat-row">
                  <span>Ejecutando:</span>
                  <strong className="running">{runningItem}</strong>
                </div>
                <div className="stat-row">
                  <span>En Waiting:</span>
                  <strong style={{ color: "#fbbf24" }}>{waitingItems}</strong>
                </div>
                <div className="stat-row">
                  <span>Directorio:</span>
                  <strong style={{ color: "#a78bfa" }}>{systemState.directorioActual}</strong>
                </div>
                <div className="stat-row">
                  <span>Archivos:</span>
                  <strong>{Object.keys(systemState.fileSystem).length}</strong>
                </div>
                <div className="stat-row">
                  <span>Sem/Mutex:</span>
                  <strong>{Object.keys(systemState.semaforos).length}</strong>
                </div>
              </div>
            </div>

            <div className="system-card processes-list">
              <h3>Procesos</h3>
              <div className="processes-grid">
                {systemState.procesos.length === 0 ? (
                  <p className="empty-text">Sin procesos activos</p>
                ) : (
                  systemState.procesos.map((process) => (
                    <ProcessCard
                      key={process.id}
                      process={process}
                      isRunning={systemState.cpuProceso?.id === process.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── Sincronización ── */}
            <div className="system-card">
              <h3>🔐 Sincronización</h3>
              <SyncPanel semaforos={systemState.semaforos} />
            </div>

            {/* ── AI Monitor ── */}
            <div className="system-card ai-monitor">
              <h3>🤖 AI Monitor</h3>
              <button
                onClick={analyzeWithAI}
                disabled={aiState.loading}
                style={{
                  marginBottom: 12, padding: "8px 16px", borderRadius: 8,
                  background: "rgba(139,92,246,0.2)", color: "#c4b5fd",
                  border: "1px solid rgba(139,92,246,0.4)",
                  cursor: aiState.loading ? "not-allowed" : "pointer",
                  opacity: aiState.loading ? 0.6 : 1,
                }}
              >
                {aiState.loading ? "⏳ Analizando..." : "🔍 Analizar ahora"}
              </button>

              {aiState.error && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "4px 0" }}>❌ {aiState.error}</p>
              )}

              {aiState.result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.85rem" }}>
                  {aiState.result.alerta && (
                    <div style={{ padding: 8, borderRadius: 6, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fcd34d" }}>
                      ⚠️ {aiState.result.alerta}
                    </div>
                  )}
                  {aiState.result.sugerencia && (
                    <div style={{ padding: 8, borderRadius: 6, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
                      💡 {aiState.result.sugerencia}
                    </div>
                  )}
                  {aiState.result.recomendacion && (
                    <div style={{ padding: 8, borderRadius: 6, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
                      🧠 {aiState.result.recomendacion}
                    </div>
                  )}
                  {!aiState.result.alerta && !aiState.result.sugerencia && !aiState.result.recomendacion && (
                    <p style={{ color: "#6b7280", margin: 0 }}>✔ Sistema estable.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Ventanas ── */}
          <section className="window-layer">
            {systemState.windows.map((windowItem) => (
              <article
                className="app-window"
                key={windowItem.id}
                style={{
                  top: `${windowItem.y}px`,
                  left: `${windowItem.x}px`,
                  width: `${windowItem.width}px`,
                  height: `${windowItem.height}px`,
                  position: "absolute",
                }}
              >
                <header className="window-header" onMouseDown={(e) => handleMouseDown(e, windowItem)}>
                  <span>{windowItem.icon} {windowItem.title}</span>
                  <button className="window-close" onClick={() => closeWindow(windowItem.id)}>✕</button>
                </header>
                <div className="window-content">
                  {windowItem.type === "file" ? (
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {systemState.fileSystem[windowItem.id]?.contenido ?? "Archivo no encontrado"}
                    </pre>
                  ) : windowItem.id === "index2" ? (
                    <iframe src="/index2.html" style={{ width: "100%", height: "100%", border: "none" }} title="Simulador" />
                  ) : (
                    <div className="app-preview">
                      <strong>{windowItem.title}</strong>
                      <p>Proceso simulado activo.</p>
                      <p>Ciérralo con <code>kill {windowItem.id}</code> o con el botón X.</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;