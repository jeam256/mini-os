import { useEffect, useRef, useState } from "react";
import {
  APP_ICONS,
  MEMORY_MAX,
  addWindow,
  createInitialState,
  executeCommand,
  tickScheduler,
} from "./system";

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
                  top: `${88 + index * 24}px`,
                  left: `${200 + index * 28}px`,
                }}
              >
                <header className="window-header">
                  <span>
                    {windowItem.icon} {windowItem.title}
                  </span>
                  <button className="window-close" onClick={() => closeWindow(windowItem.id)}>
                    x
                  </button>
                </header>
                <div className="window-content">
                  {windowItem.type === "file" ? (
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
