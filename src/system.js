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
  { id: "index2", label: "Simulador", type: "app", icon: "🌍" },
];

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

// ================================
// SISTEMA DE ARCHIVOS INICIAL
// ================================
const INITIAL_FILE_SYSTEM = {
  "/": {
    archivos: ["README.txt", "NOTAS.txt"],
    subdirs: ["/docs", "/src"],
  },
  "/docs": {
    archivos: ["manual.txt"],
    subdirs: [],
  },
  "/src": {
    archivos: ["config.txt"],
    subdirs: [],
  },
};

const INITIAL_FILES = {
  "README.txt": {
    contenido: "Sistema Operativo Mini - Simulación\n\nMódulos implementados:\n1. Gestión de Procesos\n2. Planificación de CPU (FIFO, Round Robin)\n3. Gestión de Memoria\n4. Sistema de Archivos\n\nComandos: ejecutar, procesos, memoria, kill, killall, ls, mkdir, cd, cat, write, chmod, crear, eliminar, ayuda",
    permisos: { leer: true, escribir: false, ejecutar: false },
    directorio: "/",
    creadoEn: new Date().toLocaleString(),
  },
  "NOTAS.txt": {
    contenido: "Ejemplos:\nejecutar chrome -algoritmo fifo\nejecutar vscode -algoritmo rr -quantum 3\nprocesos\nmemoria\nkill chrome\nkillall\nls\nmkdir proyectos\ncd proyectos\ncat README.txt\nwrite NOTAS.txt Nuevo contenido\nchmod NOTAS.txt r w -",
    permisos: { leer: true, escribir: true, ejecutar: false },
    directorio: "/",
    creadoEn: new Date().toLocaleString(),
  },
  "manual.txt": {
    contenido: "Manual de usuario\n\nEste sistema operativo simulado permite gestionar procesos y archivos desde la terminal.",
    permisos: { leer: true, escribir: true, ejecutar: false },
    directorio: "/docs",
    creadoEn: new Date().toLocaleString(),
  },
  "config.txt": {
    contenido: "# Configuración del sistema\nmemoria_max=50\nquantum_default=3\nalgoritmo_default=fifo",
    permisos: { leer: true, escribir: true, ejecutar: true },
    directorio: "/src",
    creadoEn: new Date().toLocaleString(),
  },
};

// ================================
// HELPERS
// ================================
function randomDuration() {
  return Math.floor(Math.random() * 8) + 4;
}

function parseCommand(input) {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { command: null, name: null, params: {}, rest: [] };

  const command = parts[0];
  const name = parts[1] ?? null;
  const rest = parts.slice(2);
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

  return { command, name, params, rest };
}

function resolverRuta(dirActual, destino) {
  if (destino === "..") {
    if (dirActual === "/") return "/";
    const partes = dirActual.split("/").filter(Boolean);
    partes.pop();
    return partes.length === 0 ? "/" : "/" + partes.join("/");
  }
  if (destino.startsWith("/")) return destino;
  return dirActual === "/" ? `/${destino}` : `${dirActual}/${destino}`;
}

function permisosDisplay(permisos) {
  return `[${permisos.leer ? "r" : "-"}${permisos.escribir ? "w" : "-"}${permisos.ejecutar ? "x" : "-"}]`;
}

// ================================
// PROCESO
// ================================
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

// ================================
// VENTANAS
// ================================
function addWindow(windows, item) {
  const existing = windows.find((w) => w.id === item.id);
  if (existing) {
    return windows.map((w) => w.id === item.id ? { ...w, minimized: false } : w);
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

// ================================
// EJECUTAR COMANDOS
// ================================
function executeCommand(state, rawInput) {
  const lines = rawInput === "clear" ? [] : [...state.logs, `MiSO ${state.directorioActual}> ${rawInput}`];
  const { command, name, params, rest } = parseCommand(rawInput);

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

    const nextActiveApps = isKnownApp && !state.appsActivas.includes(name)
      ? [...state.appsActivas, name] : state.appsActivas;

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
      nextLogs.push("No hay procesos activos");
      return { ...state, logs: nextLogs };
    }
    nextLogs.push("IDX | NOMBRE     | ESTADO    | ALGORITMO | TIEMPO/TOTAL");
    nextLogs.push("-".repeat(58));
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
    if (!process) return { ...state, logs: [...lines, `ERROR: proceso '${name}' no encontrado`] };
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
    if (state.procesos.length === 0) return { ...state, logs: [...lines, "No hay procesos activos para terminar"] };
    const count = state.procesos.length;
    return {
      ...state,
      logs: [...lines, `✓ ${count} proceso(s) terminado(s)`],
      procesos: [], colaReady: [], cpuProceso: null, appsActivas: [], memoria: 0, windows: [],
    };
  }

  // ── clear ─────────────────────────────────────────────────
  if (command === "clear") return { ...state, logs: [] };

  // ════════════════════════════════════════════════
  // SISTEMA DE ARCHIVOS
  // ════════════════════════════════════════════════

  // ── ls ────────────────────────────────────────────────────
  if (command === "ls") {
    const nextLogs = [...lines];
    const dir = state.directorios[state.directorioActual];
    if (!dir) {
      nextLogs.push(`ERROR: directorio '${state.directorioActual}' no existe`);
      return { ...state, logs: nextLogs };
    }
    nextLogs.push(`📁 ${state.directorioActual}`);
    nextLogs.push("-".repeat(40));
    if (dir.subdirs.length === 0 && dir.archivos.length === 0) {
      nextLogs.push("  (vacío)");
    }
    dir.subdirs.forEach((sub) => {
      const nombre = sub.split("/").pop();
      nextLogs.push(`  📁 ${nombre}/`);
    });
    dir.archivos.forEach((archivo) => {
      const meta = state.fileSystem[archivo];
      const perms = meta ? permisosDisplay(meta.permisos) : "[---]";
      nextLogs.push(`  📄 ${archivo.padEnd(20)} ${perms}`);
    });
    return { ...state, logs: nextLogs };
  }

  // ── mkdir ─────────────────────────────────────────────────
  if (command === "mkdir" && name) {
    const nextLogs = [...lines];
    const nuevaRuta = resolverRuta(state.directorioActual, name);
    if (state.directorios[nuevaRuta]) {
      nextLogs.push(`ERROR: el directorio '${name}' ya existe`);
      return { ...state, logs: nextLogs };
    }
    const dirActual = state.directorios[state.directorioActual];
    nextLogs.push(`✓ Directorio '${name}' creado en ${state.directorioActual}`);
    return {
      ...state,
      logs: nextLogs,
      directorios: {
        ...state.directorios,
        [state.directorioActual]: {
          ...dirActual,
          subdirs: [...dirActual.subdirs, nuevaRuta],
        },
        [nuevaRuta]: { archivos: [], subdirs: [] },
      },
    };
  }

  // ── cd ────────────────────────────────────────────────────
  if (command === "cd") {
    const nextLogs = [...lines];
    const destino = name ?? "/";
    const nuevaRuta = resolverRuta(state.directorioActual, destino);
    if (!state.directorios[nuevaRuta]) {
      nextLogs.push(`ERROR: directorio '${destino}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    nextLogs.push(`→ ${nuevaRuta}`);
    return { ...state, logs: nextLogs, directorioActual: nuevaRuta };
  }

  // ── cat ───────────────────────────────────────────────────
  if (command === "cat" && name) {
    const nextLogs = [...lines];
    const meta = state.fileSystem[name];
    if (!meta) {
      nextLogs.push(`ERROR: archivo '${name}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    if (meta.directorio !== state.directorioActual) {
      nextLogs.push(`ERROR: '${name}' no está en el directorio actual (está en ${meta.directorio})`);
      return { ...state, logs: nextLogs };
    }
    if (!meta.permisos.leer) {
      nextLogs.push(`ERROR: sin permiso de lectura en '${name}' ${permisosDisplay(meta.permisos)}`);
      return { ...state, logs: nextLogs };
    }
    nextLogs.push(`── ${name} ──`);
    meta.contenido.split("\n").forEach((linea) => nextLogs.push(linea));
    nextLogs.push(`── fin ──`);
    return { ...state, logs: nextLogs };
  }

  // ── write ─────────────────────────────────────────────────
  if (command === "write" && name) {
    const nextLogs = [...lines];
    const meta = state.fileSystem[name];
    if (!meta) {
      nextLogs.push(`ERROR: archivo '${name}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    if (meta.directorio !== state.directorioActual) {
      nextLogs.push(`ERROR: '${name}' no está en el directorio actual`);
      return { ...state, logs: nextLogs };
    }
    if (!meta.permisos.escribir) {
      nextLogs.push(`ERROR: sin permiso de escritura en '${name}' ${permisosDisplay(meta.permisos)}`);
      return { ...state, logs: nextLogs };
    }
    const nuevoContenido = rest.join(" ");
    if (!nuevoContenido) {
      nextLogs.push("ERROR: especifica el contenido → write <archivo.txt> <texto>");
      return { ...state, logs: nextLogs };
    }
    nextLogs.push(`✓ '${name}' actualizado`);
    return {
      ...state,
      logs: nextLogs,
      fileSystem: {
        ...state.fileSystem,
        [name]: { ...meta, contenido: nuevoContenido },
      },
    };
  }

  // ── chmod ─────────────────────────────────────────────────
  if (command === "chmod" && name) {
    const nextLogs = [...lines];
    const meta = state.fileSystem[name];
    if (!meta) {
      nextLogs.push(`ERROR: archivo '${name}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    if (meta.directorio !== state.directorioActual) {
      nextLogs.push(`ERROR: '${name}' no está en el directorio actual`);
      return { ...state, logs: nextLogs };
    }
    const [r, w, x] = rest;
    if (!r || !w || !x) {
      nextLogs.push("ERROR: uso → chmod <archivo.txt> <r|-> <w|-> <x|->");
      nextLogs.push("Ejemplo: chmod notas.txt r w -");
      return { ...state, logs: nextLogs };
    }
    const nuevosPermisos = {
      leer: r === "r",
      escribir: w === "w",
      ejecutar: x === "x",
    };
    nextLogs.push(`✓ Permisos de '${name}' actualizados: ${permisosDisplay(nuevosPermisos)}`);
    return {
      ...state,
      logs: nextLogs,
      fileSystem: {
        ...state.fileSystem,
        [name]: { ...meta, permisos: nuevosPermisos },
      },
    };
  }

  // ── crear ─────────────────────────────────────────────────
  if (command === "crear" && name) {
    const nextLogs = [...lines];
    if (!name.endsWith(".txt")) {
      nextLogs.push("ERROR: solo se permiten archivos .txt");
      return { ...state, logs: nextLogs };
    }
    if (state.fileSystem[name]) {
      nextLogs.push("ERROR: el archivo ya existe");
      return { ...state, logs: nextLogs };
    }
    const dirActual = state.directorios[state.directorioActual];
    nextLogs.push(`✓ Archivo '${name}' creado en ${state.directorioActual}`);
    return {
      ...state,
      logs: nextLogs,
      fileSystem: {
        ...state.fileSystem,
        [name]: {
          contenido: `Archivo: ${name}\nCreado: ${new Date().toLocaleString()}\n\nEscribe contenido con: write ${name} <texto>`,
          permisos: { leer: true, escribir: true, ejecutar: false },
          directorio: state.directorioActual,
          creadoEn: new Date().toLocaleString(),
        },
      },
      directorios: {
        ...state.directorios,
        [state.directorioActual]: {
          ...dirActual,
          archivos: [...dirActual.archivos, name],
        },
      },
      desktopItems: state.directorioActual === "/"
        ? [...state.desktopItems, { id: name, label: name, type: "file", icon: "📄" }]
        : state.desktopItems,
    };
  }

  // ── eliminar / rm ─────────────────────────────────────────
  if ((command === "eliminar" || command === "rm") && name) {
    const nextLogs = [...lines];
    const meta = state.fileSystem[name];
    if (!meta) {
      nextLogs.push(`ERROR: archivo '${name}' no encontrado`);
      return { ...state, logs: nextLogs };
    }
    if (meta.directorio !== state.directorioActual) {
      nextLogs.push(`ERROR: '${name}' no está en el directorio actual`);
      return { ...state, logs: nextLogs };
    }
    if (!meta.permisos.escribir) {
      nextLogs.push(`ERROR: sin permiso de escritura para eliminar '${name}' ${permisosDisplay(meta.permisos)}`);
      return { ...state, logs: nextLogs };
    }
    const nextFileSystem = { ...state.fileSystem };
    delete nextFileSystem[name];
    const dirActual = state.directorios[state.directorioActual];
    nextLogs.push(`✓ Archivo '${name}' eliminado`);
    return {
      ...state,
      logs: nextLogs,
      fileSystem: nextFileSystem,
      directorios: {
        ...state.directorios,
        [state.directorioActual]: {
          ...dirActual,
          archivos: dirActual.archivos.filter((a) => a !== name),
        },
      },
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
        "",
        "=== PROCESOS ===",
        "ejecutar <nombre> [-algoritmo fifo|rr] [-quantum N]",
        "procesos | memoria | kill <nombre> | killall",
        "",
        "=== SISTEMA DE ARCHIVOS ===",
        "ls                              Listar directorio actual",
        "mkdir <nombre>                  Crear carpeta",
        "cd <nombre> | cd ..             Cambiar directorio",
        "cat <archivo.txt>               Ver contenido",
        "write <archivo.txt> <texto>     Escribir en archivo",
        "chmod <archivo.txt> <r|-> <w|-> <x|->   Cambiar permisos",
        "crear <archivo.txt>             Crear archivo",
        "eliminar <archivo.txt>          Eliminar archivo",
        "",
        "=== GENERAL ===",
        "clear | ayuda",
        "",
      ],
    };
  }

  return {
    ...state,
    logs: [...lines, `ERROR: comando '${command}' no reconocido. Escribe 'ayuda'`],
  };
}

// ================================
// SCHEDULER
// ================================
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

// ================================
// ESTADO INICIAL
// ================================
function createInitialState() {
  return {
    logs: [
      "=== Mini OS v2.0 ===",
      "Sistema iniciado correctamente",
      "Módulos: Procesos | CPU (FIFO/RR) | Memoria | Sistema de Archivos",
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
    fileSystem: INITIAL_FILES,
    directorios: INITIAL_FILE_SYSTEM,
    directorioActual: "/",
    hora: new Date().toLocaleTimeString("es-MX"),
  };
}

// ================================
// SNAPSHOT PARA IA
// ================================
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
    sistemaArchivos: {
      directorioActual: state.directorioActual,
      totalArchivos: Object.keys(state.fileSystem).length,
      directorios: Object.keys(state.directorios),
    },
  };
}

export {
  APP_ICONS,
  INITIAL_DESKTOP_ITEMS,
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