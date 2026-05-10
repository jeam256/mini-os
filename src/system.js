// ================================
// CONFIGURACIÓN DEL SISTEMA
// ================================
const APP_ICONS = {
  terminal: "🖥",
  chrome: "🌐",
  whatsapp: "💬",
  spotify: "🎵",
  vscode: "🧠",
  notepad: "📝",
  index2: "🌍",
};

const INITIAL_DESKTOP_ITEMS = [
  { id: "chrome", label: "Chrome", type: "app", icon: APP_ICONS.chrome },
  { id: "notepad", label: "Notepad", type: "app", icon: APP_ICONS.notepad },
  { id: "vscode", label: "VS Code", type: "app", icon: APP_ICONS.vscode },
  { id: "archivo1.txt", label: "README.txt", type: "file", icon: "📄" },
  { id: "archivo2.txt", label: "NOTAS.txt", type: "file", icon: "📄" },
  { id: "index2", label: "Simulador", type: "app", icon: "🌍" },
];

const INITIAL_FILE_CONTENTS = {
  "archivo1.txt": "Sistema Operativo Mini - Simulación\n\nMódulos implementados:\n1. Gestión de Procesos\n2. Planificación de CPU (FIFO, Round Robin)\n3. Gestión de Memoria\n\nComandos: ejecutar, procesos, memoria, kill, killall, crear, eliminar, ayuda",
  "archivo2.txt": "Ejemplos:\nejecutar chrome -algoritmo fifo\nejecutar vscode -algoritmo rr -quantum 3\nprocesos\nmemoria\nkill chrome\nkillall",
};

const MEMORY_MAX = 50;
const MEMORY_PER_PROCESS = 5;

const PROCESS_STATES = {
  NEW: "NEW",
  READY: "READY",
  RUNNING: "RUNNING",
  WAITING: "WAITING",
  TERMINATED: "TERMINATED",
};

const SCHEDULING_ALGORITHMS = {
  FIFO: "fifo",
  ROUND_ROBIN: "rr",
};

function randomDuration() {
  return Math.floor(Math.random() * 8) + 4;
}

function parseCommand(input) {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { command: null, name: null, params: {} };

  const command = parts[0];
  const name = parts[1] ?? null;
  const params = {};

  let index = 2;
  while (index < parts.length) {
    const token = parts[index];
    if (token.startsWith("-")) {
      const nextToken = parts[index + 1];
      params[token] = nextToken && !nextToken.startsWith("-") ? nextToken : true;
      index += nextToken && !nextToken.startsWith("-") ? 2 : 1;
    } else {
      index += 1;
    }
  }

  return { command, name, params };
}

function buildProcess(name, params, isApp) {
  const algoritmo = (params["-algoritmo"] ?? "fifo").toLowerCase();
  const quantum = Math.max(1, Number.parseInt(params["-quantum"] ?? "3", 10));
  const duracion = isApp ? Infinity : randomDuration();

  return {
    id: Math.random().toString(36).substring(2, 10),
    nombre: name,
    estado: PROCESS_STATES.NEW,
    tiempo: 0,
    tiempoRestante: isApp ? Infinity : duracion,
    duracion,
    algoritmo: algoritmo === "rr" ? SCHEDULING_ALGORITHMS.ROUND_ROBIN : SCHEDULING_ALGORITHMS.FIFO,
    quantum,
    cuantumUsado: 0,
    infinito: isApp,
    createdAt: Date.now(),
  };
}

function addWindow(windows, item) {
  const existing = windows.find((w) => w.id === item.id);
  if (existing) {
    return windows.map((w) =>
      w.id === item.id ? { ...w, minimized: false } : w
    );
  }

  return [
    ...windows,
    {
      id: item.id,
      title: item.label,
      type: item.type,
      icon: item.icon,
      minimized: false,
      maximized: false,
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      width: item.id === "index2" ? 900 : 600,
      height: item.id === "index2" ? 650 : 400,
    },
  ];
}

function moveWindow(windows, id, x, y) {
  return windows.map((win) => win.id === id ? { ...win, x, y } : win);
}

function executeCommand(state, rawInput) {
  const lines = rawInput === "clear" ? [] : [...state.logs, `MiSO> ${rawInput}`];
  const { command, name, params } = parseCommand(rawInput);

  if (!command) return { ...state, logs: lines };

  // ── ejecutar ──────────────────────────────────────────────
  if (command === "ejecutar") {
    const isKnownApp = Boolean(APP_ICONS[name]);
    const nextLogs = [...lines];

    if (!name) {
      nextLogs.push("ERROR: especifica un nombre de proceso");
      return { ...state, logs: nextLogs };
    }

    if (state.memoria + MEMORY_PER_PROCESS > MEMORY_MAX) {
      nextLogs.push(`ERROR: Memoria insuficiente (necesita ${MEMORY_PER_PROCESS}, disponible ${MEMORY_MAX - state.memoria})`);
      return { ...state, logs: nextLogs };
    }

    const nextActiveApps =
      isKnownApp && !state.appsActivas.includes(name)
        ? [...state.appsActivas, name]
        : state.appsActivas;

    if (!isKnownApp) nextLogs.push(`${name} ejecutado como proceso en segundo plano`);

    const process = buildProcess(name, params, isKnownApp);
    const algoritmoDisplay = process.algoritmo === SCHEDULING_ALGORITHMS.ROUND_ROBIN ? "Round Robin" : "FIFO";
    const duracionDisplay = process.infinito ? "∞" : `${process.duracion}s`;
    nextLogs.push(`✓ Proceso '${name}' creado (${algoritmoDisplay}, quantum=${process.quantum}, duración=${duracionDisplay})`);

    const matchingDesktopItem =
      state.desktopItems.find((item) => item.id === name) ||
      (isKnownApp ? { id: name, label: name, type: "app", icon: APP_ICONS[name] } : null);

    return {
      ...state,
      logs: nextLogs,
      procesos: [...state.procesos, process],
      colaReady: [...state.colaReady, process],
      appsActivas: nextActiveApps,
      memoria: state.memoria + MEMORY_PER_PROCESS,
      windows: matchingDesktopItem ? addWindow(state.windows, matchingDesktopItem) : state.windows,
    };
  }

  // ── procesos ──────────────────────────────────────────────
  if (command === "procesos") {
    const nextLogs = [...lines];
    if (state.procesos.length === 0) {
      nextLogs.push("No hay procesos");
      return { ...state, logs: nextLogs };
    }
    nextLogs.push("PID | NOMBRE | ESTADO | ALGORITMO | TIEMPO/TOTAL");
    nextLogs.push("-".repeat(55));
    state.procesos.forEach((p, idx) => {
      const tiempo = p.infinito ? `${p.tiempo}/∞` : `${p.tiempo}/${p.duracion}`;
      const algo = p.algoritmo === SCHEDULING_ALGORITHMS.ROUND_ROBIN ? "RR" : "FIFO";
      nextLogs.push(`${String(idx).padEnd(3)} | ${p.nombre.padEnd(10)} | ${p.estado.padEnd(9)} | ${algo.padEnd(9)} | ${tiempo}`);
    });
    return { ...state, logs: nextLogs };
  }

  // ── memoria ───────────────────────────────────────────────
  if (command === "memoria") {
    const porcentaje = Math.round((state.memoria / MEMORY_MAX) * 100);
    return { ...state, logs: [...lines, `Memoria: ${state.memoria}/${MEMORY_MAX} MB (${porcentaje}%)`] };
  }

  // ── kill ──────────────────────────────────────────────────
  if (command === "kill" && name) {
    const process = state.procesos.find((p) => p.nombre === name);
    if (!process) {
      return { ...state, logs: [...lines, `ERROR: proceso '${name}' no encontrado`] };
    }
    return {
      ...state,
      logs: [...lines, `✓ Proceso '${name}' terminado (pid: ${process.id})`],
      appsActivas: state.appsActivas.filter((a) => a !== name),
      procesos: state.procesos.filter((p) => p !== process),
      colaReady: state.colaReady.filter((p) => p !== process),
      cpuProceso: state.cpuProceso?.id === process.id ? null : state.cpuProceso,
      memoria: Math.max(0, state.memoria - MEMORY_PER_PROCESS),
      windows: state.windows.filter((w) => w.id !== name),
    };
  }

  // ── killall ───────────────────────────────────────────────
  if (command === "killall") {
    if (state.procesos.length === 0) {
      return { ...state, logs: [...lines, "No hay procesos activos para terminar"] };
    }
    const count = state.procesos.length;
    return {
      ...state,
      logs: [...lines, `✓ ${count} proceso(s) terminado(s)`],
      procesos: [],
      colaReady: [],
      cpuProceso: null,
      appsActivas: [],
      memoria: 0,
      windows: [],
    };
  }

  // ── clear ─────────────────────────────────────────────────
  if (command === "clear") return { ...state, logs: [] };

  // ── crear ─────────────────────────────────────────────────
  if (command === "crear" && name) {
    const nextLogs = [...lines];
    if (!name.endsWith(".txt")) {
      nextLogs.push("ERROR: Solo puedes crear archivos con extensión .txt");
      return { ...state, logs: nextLogs };
    }
    if (state.fileContents[name]) {
      nextLogs.push("ERROR: El archivo ya existe");
      return { ...state, logs: nextLogs };
    }
    nextLogs.push(`✓ Archivo '${name}' creado`);
    return {
      ...state,
      logs: nextLogs,
      fileContents: {
        ...state.fileContents,
        [name]: `Archivo: ${name}\nCreado: ${new Date().toLocaleString()}\n\nContenido...`,
      },
      desktopItems: [...state.desktopItems, { id: name, label: name, type: "file", icon: "📄" }],
    };
  }

  // ── eliminar / rm ─────────────────────────────────────────
  if ((command === "eliminar" || command === "rm") && name) {
    const nextLogs = [...lines];
    const fileItem = state.desktopItems.find((item) => item.id === name && item.type === "file");
    if (!fileItem) {
      nextLogs.push(`ERROR: archivo '${name}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    const nextFileContents = { ...state.fileContents };
    delete nextFileContents[name];
    nextLogs.push(`✓ Archivo '${name}' eliminado`);
    return {
      ...state,
      logs: nextLogs,
      fileContents: nextFileContents,
      desktopItems: state.desktopItems.filter((item) => item.id !== name),
      windows: state.windows.filter((w) => w.id !== name),
    };
  }

  // ── ayuda ─────────────────────────────────────────────────
  if (command === "ayuda" || command === "help") {
    return {
      ...state,
      logs: [
        ...lines,
        "\n=== COMANDOS DISPONIBLES ===",
        "ejecutar <p> [-algoritmo fifo|rr] [-quantum N]   Crear proceso",
        "procesos                                          Listar procesos",
        "memoria                                           Ver uso de memoria",
        "kill <proceso>                                    Terminar proceso",
        "killall                                           Terminar todos los procesos",
        "crear <archivo.txt>                               Crear archivo",
        "eliminar <archivo.txt>                            Eliminar archivo",
        "clear                                             Limpiar terminal",
        "ayuda                                             Mostrar ayuda\n",
      ],
    };
  }

  return {
    ...state,
    logs: [...lines, "ERROR: comando no reconocido. Escribe 'ayuda' para más info"],
  };
}

function tickScheduler(state) {
  let procesos = [...state.procesos];
  let colaReady = [...state.colaReady];
  let cpuProceso = state.cpuProceso;
  let memoria = state.memoria;

  if (!cpuProceso && colaReady.length > 0) {
    cpuProceso = colaReady[0];
    colaReady = colaReady.slice(1);
    procesos = procesos.map((p) =>
      p.id === cpuProceso.id ? { ...p, estado: PROCESS_STATES.RUNNING } : p
    );
    cpuProceso = procesos.find((p) => p.id === cpuProceso.id) || cpuProceso;
  }

  if (cpuProceso) {
    const processIndex = procesos.findIndex((p) => p.id === cpuProceso.id);

    if (processIndex !== -1) {
      const cur = procesos[processIndex];

      if (cur.infinito) {
        const updated = { ...cur, tiempo: cur.tiempo + 1, estado: PROCESS_STATES.RUNNING };
        if (
          cur.algoritmo === SCHEDULING_ALGORITHMS.ROUND_ROBIN &&
          updated.cuantumUsado + 1 >= cur.quantum
        ) {
          const rotated = { ...updated, cuantumUsado: 0, estado: PROCESS_STATES.READY };
          procesos[processIndex] = rotated;
          colaReady = [...colaReady, rotated];
          cpuProceso = null;
        } else {
          const withQ = { ...updated, cuantumUsado: updated.cuantumUsado + 1 };
          procesos[processIndex] = withQ;
          cpuProceso = withQ;
        }
      } else {
        const tiempoRestante = Math.max(0, cur.tiempoRestante - 1);
        const cuantumUsado = cur.cuantumUsado + 1;
        let next = { ...cur, tiempo: cur.tiempo + 1, tiempoRestante, cuantumUsado };

        const switchContext =
          cur.algoritmo === SCHEDULING_ALGORITHMS.ROUND_ROBIN &&
          cuantumUsado >= cur.quantum &&
          tiempoRestante > 0;

        if (tiempoRestante <= 0) {
          next = { ...next, estado: PROCESS_STATES.TERMINATED };
          procesos[processIndex] = next;
          memoria = Math.max(0, memoria - MEMORY_PER_PROCESS);
          cpuProceso = null;
        } else if (switchContext) {
          next = { ...next, estado: PROCESS_STATES.READY, cuantumUsado: 0 };
          procesos[processIndex] = next;
          colaReady = [...colaReady, next];
          cpuProceso = null;
        } else {
          procesos[processIndex] = next;
          cpuProceso = next;
        }
      }
    }
  }

  procesos = procesos.filter((p) => p.estado !== PROCESS_STATES.TERMINATED);

  return {
    ...state,
    procesos,
    colaReady,
    cpuProceso,
    memoria,
    hora: new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function createInitialState() {
  return {
    logs: [
      "=== Mini OS v1.0 ===",
      "Sistema iniciado correctamente",
      "Módulos: Gestión de Procesos | Planificación CPU (FIFO/RR) | Gestión de Memoria",
      "",
      "Escribe 'ayuda' para ver los comandos disponibles",
      "",
    ],
    procesos: [],
    colaReady: [],
    cpuProceso: null,
    appsActivas: [],
    memoria: 0,
    windows: [],
    desktopItems: INITIAL_DESKTOP_ITEMS,
    fileContents: INITIAL_FILE_CONTENTS,
    hora: new Date().toLocaleTimeString("es-MX"),
  };
}

export function buildSystemSnapshot(state) {
  return {
    memoria: { usada: state.memoria, total: MEMORY_MAX },
    procesos: state.procesos.map((p) => ({
      nombre: p.nombre,
      estado: p.estado,
      algoritmo: p.algoritmo,
      infinito: p.infinito,
      tiempo: p.tiempo,
      duracion: p.infinito ? "∞" : p.duracion,
    })),
    cpuActual: state.cpuProceso?.nombre ?? null,
    colaReady: state.colaReady.length,
  };
}

export {
  APP_ICONS,
  INITIAL_DESKTOP_ITEMS,
  INITIAL_FILE_CONTENTS,
  MEMORY_MAX,
  MEMORY_PER_PROCESS,
  PROCESS_STATES,
  SCHEDULING_ALGORITHMS,
  createInitialState,
  executeCommand,
  tickScheduler,
  addWindow,
  moveWindow,
};