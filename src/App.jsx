import { useEffect, useRef, useState } from "react";
import {
  APP_ICONS,
  MEMORY_MAX,
  addWindow,
  createInitialState,
  executeCommand,
  tickScheduler,
} from "./system";

function toggleMaximize(id) {
  setSystemState((current) => ({
    ...current,
    windows: current.windows.map((win) => {
      if (win.id !== id) return win;

      if (!win.maximized) {
        // guardar tamaño anterior
        return {
          ...win,
          maximized: true,
          prevX: win.x,
          prevY: win.y,
          prevWidth: win.width,
          prevHeight: win.height,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      } else {
        // restaurar
        return {
          ...win,
          maximized: false,
          x: win.prevX,
          y: win.prevY,
          width: win.prevWidth,
          height: win.prevHeight,
        };
      }
    }),
  }));
}

function App() {
  const [systemState, setSystemState] = useState(createInitialState);
  const [input, setInput] = useState("");
  const terminalBodyRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSystemState((current) => tickScheduler(current));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const node = terminalBodyRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [systemState.logs]);

function moveWindow(id, x, y) {
  setSystemState((current) => ({
    ...current,
    windows: current.windows.map((win) =>
      win.id === id ? { ...win, x, y } : win
    ),
  }));
}

function handleMouseDown(e, windowItem) {
  const startX = e.clientX - windowItem.x;
  const startY = e.clientY - windowItem.y;

  function onMouseMove(e) {
    const newX = e.clientX - startX;
    const newY = e.clientY - startY;

    moveWindow(windowItem.id, newX, newY);
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

  function handleSubmit(event) {
    event.preventDefault();
    const rawCommand = input.trim();
    setSystemState((current) => executeCommand(current, rawCommand));
    setInput("");
  }

  function handleOpenItem(item) {
    setSystemState((current) => {
      if (item.type === "app") {
        return executeCommand(current, `ejecutar ${item.id}`);
      }

      return {
        ...current,
        windows: addWindow(current.windows, item),
      };
    });
  }

  function closeWindow(id) {
    setSystemState((current) => ({
      ...current,
      windows: current.windows.filter((windowItem) => windowItem.id !== id),
    }));
  }

  const readyItems = systemState.colaReady.map((process) => process.nombre).join(", ") || "Ninguno";
  const finishedItems =
    systemState.procesos
      .filter((process) => process.estado === "FINISHED")
      .map((process) => process.nombre)
      .join(", ") || "Ninguno";

  return (
    <main className="app-shell">
      <section className="terminal-pane">
        <div className="panel-header">
          <span className="panel-title">{APP_ICONS.terminal} terminal</span>
          <span className="panel-pill">scheduler fifo</span>
        </div>

        <div className="terminal-body" ref={terminalBodyRef}>
          {systemState.logs.map((line, index) => (
            <div className="terminal-line" key={`${line}-${index}`}>
              {line}
            </div>
          ))}
        </div>

        <form className="terminal-input-row" onSubmit={handleSubmit}>
          <span className="prompt">MiSO&gt;</span>
          <input
            className="terminal-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="ejecutar chrome -algoritmo fifo"
            autoFocus
          />
        </form>
      </section>

      <section className="desktop-pane">
        <div className="desktop-topbar">
          <div className="status-chip">CPU: {systemState.cpuProceso?.nombre ?? "Idle"}</div>
          <div className="status-chip">
            Memoria: {systemState.memoria}/{MEMORY_MAX}
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
              <h2>Sistema</h2>
              <p>READY: {readyItems}</p>
              <p>RUNNING: {systemState.cpuProceso?.nombre ?? "Ninguno"}</p>
              <p>FINISHED: {finishedItems}</p>
            </div>

            <div className="system-card">
              <h2>Apps activas</h2>
              <div className="dock-row">
                {systemState.appsActivas.length > 0 ? (
                  systemState.appsActivas.map((app) => (
                    <span className="dock-item" key={app}>
                      {APP_ICONS[app] ?? "❔"} {app}
                    </span>
                  ))
                ) : (
                  <span className="dock-empty">Sin apps activas</span>
                )}
              </div>
            </div>
          </section>

          <section className="window-layer">
            {systemState.windows.map((windowItem, index) => (
              <article
                className="app-window"
                key={windowItem.id}
                style={{
                  top: `${windowItem.y}px`,
                  left: `${windowItem.x}px`,
                  position: "absolute",                
                }}
              >
                <header className="window-header"
                  onMouseDown={(e) => handleMouseDown(e, windowItem)} onDoubleClick={() => toggleMaximize(windowItem.id)}>
                  <span>
                    {windowItem.icon} {windowItem.title}
                  </span>
                  <button className="window-close" onClick={() => closeWindow(windowItem.id)}>
                    x
                  </button>
                </header>
                <div className="window-content">
                  {windowItem.id === "simulador" ? (
                    <iframe
                      src="/index2.html"
                      title="Simulador"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                    />
                  ) : windowItem.type === "file" ? (
                      <pre>{systemState.fileContents[windowItem.id]}</pre>
                  ) : (
                    <div className="app-preview">
                      <strong>{windowItem.title}</strong>
                      <p>Proceso simulado activo en el sistema.</p>
                      <p>Cierralo con `kill {windowItem.id}` o con la ventana.</p>
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
