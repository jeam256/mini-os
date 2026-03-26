const APP_ICONS = {
  terminal: "🖥",
  chrome: "🌐",
  whatsapp: "💬",
  spotify: "🎵",
  vscode: "🧠",
  notepad: "📝",
};

const INITIAL_DESKTOP_ITEMS = [
  { id: "chrome", label: "chrome", type: "app", icon: APP_ICONS.chrome },
  { id: "notepad", label: "notepad", type: "app", icon: APP_ICONS.notepad },
  { id: "archivo1.txt", label: "archivo1.txt", type: "file", icon: "📄" },
  { id: "archivo2.txt", label: "archivo2.txt", type: "file", icon: "📄" },
];

const INITIAL_FILE_CONTENTS = {
  "archivo1.txt": "Log del sistema:\n- Arranque correcto\n- Interfaz cargada\n- Scheduler activo",
  "archivo2.txt": "Notas:\n- ejecutar chrome\n- procesos\n- memoria\n- kill chrome",
};

const MEMORY_MAX = 30;

function randomDuration() {
  return Math.floor(Math.random() * 6) + 5;
}

function parseCommand(input) {
  const parts = input.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { command: null, name: null, params: {} };
  }

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
  return {
    nombre: name,
    estado: "READY",
    tiempo: 0,
    duracion: randomDuration(),
    algoritmo: params["-algoritmo"] ?? "fifo",
    quantum: Number.parseInt(params["-quantum"] ?? "3", 10),
    infinito: isApp,
  };
}

function addWindow(windows, item) {
  const existing = windows.find((windowItem) => windowItem.id === item.id);
  if (existing) {
    return windows.map((windowItem) =>
      windowItem.id === item.id ? { ...windowItem, minimized: false } : windowItem,
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
    },
  ];
}

function executeCommand(state, rawInput) {
  const lines = rawInput === "clear" ? [] : [...state.logs, `MiSO> ${rawInput}`];
  const { command, name, params } = parseCommand(rawInput);

  if (!command) {
    return { ...state, logs: lines };
  }

  if (command === "ejecutar") {
    const isKnownApp = Boolean(APP_ICONS[name]);
    const nextLogs = [...lines];

    if (state.memoria + 5 > MEMORY_MAX) {
      nextLogs.push("ERROR: Memoria insuficiente");
      return { ...state, logs: nextLogs };
    }

    const nextActiveApps =
      isKnownApp && !state.appsActivas.includes(name)
        ? [...state.appsActivas, name]
        : state.appsActivas;

    if (!isKnownApp) {
      nextLogs.push(`${name} ejecutado como proceso en segundo plano`);
    }

    const process = buildProcess(name, params, isKnownApp);
    nextLogs.push(`Proceso ${name} creado con ${process.algoritmo.toUpperCase()}`);

    const matchingDesktopItem =
      state.desktopItems.find((item) => item.id === name) ||
      (isKnownApp
        ? { id: name, label: name, type: "app", icon: APP_ICONS[name] }
        : null);

    return {
      ...state,
      logs: nextLogs,
      procesos: [...state.procesos, process],
      colaReady: [...state.colaReady, process],
      appsActivas: nextActiveApps,
      memoria: state.memoria + 5,
      windows: matchingDesktopItem ? addWindow(state.windows, matchingDesktopItem) : state.windows,
    };
  }

  if (command === "procesos") {
    const nextLogs = [...lines];
    state.procesos.forEach((process) => {
      nextLogs.push(`${process.nombre} | ${process.estado} | ${process.algoritmo}`);
    });
    return { ...state, logs: nextLogs };
  }

  if (command === "memoria") {
    return {
      ...state,
      logs: [...lines, `Memoria: ${state.memoria}/${MEMORY_MAX}`],
    };
  }

  if (command === "kill" && name) {
    const process = state.procesos.find((item) => item.nombre === name);

    if (!process) {
      return { ...state, logs: [...lines, "Proceso no encontrado"] };
    }

    return {
      ...state,
      logs: [...lines, `${name} eliminado y memoria liberada`],
      appsActivas: state.appsActivas.filter((app) => app !== name),
      procesos: state.procesos.filter((item) => item !== process),
      colaReady: state.colaReady.filter((item) => item !== process),
      cpuProceso: state.cpuProceso === process ? null : state.cpuProceso,
      memoria: Math.max(0, state.memoria - 5),
      windows: state.windows.filter((windowItem) => windowItem.id !== name),
    };
  }

  if (command === "clear") {
    return { ...state, logs: [] };
  }

  if (command === "crear" && name) {
    const nextLogs = [...lines];

    if (!name.endsWith(".txt")) {
      nextLogs.push("Solo puedes crear archivos con extension .txt");
      return { ...state, logs: nextLogs };
    }

    if (state.fileContents[name]) {
      nextLogs.push("El archivo ya existe");
      return { ...state, logs: nextLogs };
    }

    return {
      ...state,
      logs: [...nextLogs, `Archivo ${name} creado`],
      fileContents: {
        ...state.fileContents,
        [name]: `Nuevo archivo: ${name}\nEscribe aqui tu contenido simulado.`,
      },
      desktopItems: [
        ...state.desktopItems,
        { id: name, label: name, type: "file", icon: "📄" },
      ],
    };
  }

  if ((command === "eliminar" || command === "rm") && name) {
    const nextLogs = [...lines];
    const fileItem = state.desktopItems.find((item) => item.id === name && item.type === "file");

    if (!fileItem) {
      nextLogs.push("Archivo no encontrado");
      return { ...state, logs: nextLogs };
    }

    const nextFileContents = { ...state.fileContents };
    delete nextFileContents[name];

    return {
      ...state,
      logs: [...nextLogs, `Archivo ${name} eliminado`],
      fileContents: nextFileContents,
      desktopItems: state.desktopItems.filter((item) => item.id !== name),
      windows: state.windows.filter((windowItem) => windowItem.id !== name),
    };
  }

  return {
    ...state,
    logs: [...lines, "Comando no reconocido"],
  };
}

function tickScheduler(state) {
  let cpuProceso = state.cpuProceso;
  let colaReady = [...state.colaReady];
  let procesos = [...state.procesos];
  let memoria = state.memoria;

  if (!cpuProceso && colaReady.length > 0) {
    cpuProceso = colaReady[0];
    colaReady = colaReady.slice(1);
    procesos = procesos.map((process) =>
      process === cpuProceso ? { ...process, estado: "RUNNING" } : process,
    );
    cpuProceso = procesos.find((process) => process.nombre === cpuProceso.nombre) ?? cpuProceso;
  }

  if (cpuProceso) {
    const updatedCpu = { ...cpuProceso, tiempo: cpuProceso.tiempo + 1 };
    procesos = procesos.map((process) =>
      process.nombre === updatedCpu.nombre ? updatedCpu : process,
    );
    cpuProceso = updatedCpu;

    if (!updatedCpu.infinito && updatedCpu.tiempo >= updatedCpu.duracion) {
      const finishedCpu = { ...updatedCpu, estado: "FINISHED" };
      procesos = procesos.map((process) =>
        process.nombre === finishedCpu.nombre ? finishedCpu : process,
      );
      memoria = Math.max(0, memoria - 5);
      cpuProceso = null;
    }
  }

  return {
    ...state,
    procesos,
    colaReady,
    cpuProceso,
    memoria,
    hora: new Date().toLocaleTimeString("es-GT"),
  };
}

function createInitialState() {
  return {
    logs: [
      "Mini OS iniciado",
      "Comandos: ejecutar, procesos, memoria, kill, crear <archivo.txt>, eliminar <archivo.txt>, clear",
    ],
    procesos: [],
    colaReady: [],
    cpuProceso: null,
    appsActivas: [],
    memoria: 0,
    windows: [],
    desktopItems: INITIAL_DESKTOP_ITEMS,
    fileContents: INITIAL_FILE_CONTENTS,
    hora: new Date().toLocaleTimeString("es-GT"),
  };
}

export {
  APP_ICONS,
  INITIAL_DESKTOP_ITEMS,
  INITIAL_FILE_CONTENTS,
  MEMORY_MAX,
  createInitialState,
  executeCommand,
  tickScheduler,
  addWindow,
};
