# Documentación de Archivos - Mini OS

## 📁 Estructura del Proyecto

```
mini-os/
├── src/                    # Código fuente principal
│   ├── App.jsx            # ⭐ Componente React principal
│   ├── system.js          # ⭐ Lógica del SO (CORE)
│   ├── main.jsx           # Entry point de React
│   ├── styles.css         # 🎨 Estilos globales (dark theme)
│   ├── App.css            # Estilos del componente App
│   └── index.css          # CSS adicional
│
├── public/                # Assets estáticos
│   └── index2.html       # HTML secundario
│
├── dist/                 # Build compilado (auto-generado)
│
├── node_modules/         # Dependencias npm (auto-generado)
│
├── 📄 index.html         # HTML principal (punto de entrada)
├── 📄 package.json       # Dependencias y scripts
├── 📄 vite.config.js     # Configuración de Vite
├── 📄 .gitignore         # Archivos ignorados por git
│
├── 📘 README.md          # Documentación completa
├── 📘 GUIA_RAPIDA.md    # Guía de inicio rápido
└── 📘 ARQUITECTURA.md    # Este archivo
```

---

## ⭐ Archivos Principales

### 1️⃣ `src/system.js` - CORE DEL SO

**Responsabilidad**: Toda la lógica del Sistema Operativo

#### Constantes Principales
```javascript
MEMORY_MAX = 50                    // Memoria máxima (MB)
MEMORY_PER_PROCESS = 5            // Memoria por proceso
PROCESS_STATES = {                // Estados posibles
  NEW, READY, RUNNING, WAITING, TERMINATED
}
SCHEDULING_ALGORITHMS = {         // Algoritmos
  FIFO: "fifo",
  ROUND_ROBIN: "rr"
}
```

#### Funciones Principales

**`createInitialState()`**
- Crea el estado inicial del SO
- Retorna objeto con: procesos[], colaReady[], cpuProceso, memoria, etc.

**`executeCommand(state, rawInput)`** 
- Procesa comandos del usuario (ejecutar, kill, procesos, memoria, etc.)
- Actualiza el estado del sistema
- Retorna nuevo estado

**`tickScheduler(state)`**
- Ejecuta 1 ciclo del scheduler cada segundo
- Implementa FIFO y Round Robin
- Maneja transiciones de estados
- Libera memoria cuando procesos terminan

**`buildProcess(name, params, isApp)`**
- Crea un nuevo objeto Process
- Asigna duración aleatoria (4-12 segundos)
- Configura algoritmo y quantum

**`parseCommand(input)`**
- Parsea comandos de línea: "ejecutar chrome -algoritmo rr -quantum 2"
- Retorna: {command, name, params}

---

### 2️⃣ `src/App.jsx` - COMPONENTE PRINCIPAL

**Responsabilidad**: Interfaz Visual y Gestión de React

#### Componentes Sub-componentes

**`<ProcessCard />`**
- Visualiza un proceso individual
- Colores según estado
- Muestra: nombre, ID, estado, algoritmo, tiempo

**`<MemoryBar />`**
- Barra visual de memoria usada/total
- Porcentaje dinámico
- Colores gradiente naranja-rosa

**`<CPUStatus />`**
- Muestra CPU actual en ejecución
- Barra de progreso del proceso
- Estado "Idle" cuando no hay procesos

#### Estructura Principal del App

1. **Terminal Pane** (Izquierda)
   - Logs del sistema
   - Input de comandos
   - Soporte de scroll automático

2. **Desktop Pane** (Derecha)
   - Topbar con estado general
   - Desktop Icons (apps y archivos)
   - System Panel (CPU, Memoria, Estado)
   - Window Layer (ventanas flotantes)

#### Hooks Utilizados
- `useState()` - Manejo de estado global (systemState)
- `useEffect()` - Scheduler loop (cada 1 segundo)
- `useRef()` - Referencia a terminal para auto-scroll

---

### 3️⃣ `src/styles.css` - DISEÑO

**Tema**: Dark Mode profesional con glassmorphism

#### Variables de Color Principales
```css
Primary: rgba(59, 130, 246, ...)   /* Azul */
Success: rgba(34, 197, 94, ...)    /* Verde */
Warning: rgba(234, 179, 8, ...)    /* Amarillo */
Danger: rgba(239, 68, 68, ...)     /* Rojo */
Background: #0a0e27               /* Muy oscuro */
```

#### Layouts Principales
- `.app-shell` - Grid 2 columnas (Terminal | Desktop)
- `.desktop-content` - Grid para desktop
- `.processes-grid` - Auto-fit responsive grid para procesos
- `.window-layer` - Absolute positioning para ventanas

#### Animaciones
- `pulse` - Latido del CPU en ejecución
- `glow` - Brillo de proceso running
- Transiciones suaves en todos los componentes

---

## 🔄 Flujo de Datos

```
Usuario escribe comando
         ↓
executeCommand() en system.js
         ↓
Valida memoria y parámetros
         ↓
Crea Process objeto
         ↓
Añade a procesos[] y colaReady[]
         ↓
Retorna nuevo state
         ↓
App.jsx renderiza
         ↓
Cada segundo: tickScheduler()
         ↓
Scheduler lee colaReady[]
         ↓
Carga proceso en CPU
         ↓
Decrementa tiempoRestante
         ↓
Verifica quantum (para RR)
         ↓
Cambio de contexto o termina
         ↓
App renderiza cambios
```

---

## 📋 Ciclo del Scheduler (tickScheduler)

### Pseudocódigo
```javascript
if (!cpuProceso && colaReady.length > 0) {
  cpuProceso = colaReady.sacar_primero()
  cpuProceso.estado = RUNNING
}

if (cpuProceso) {
  cpuProceso.tiempoRestante--
  cpuProceso.cuantumUsado++
  
  if (tiempoRestante == 0) {
    cpuProceso.estado = TERMINATED
    memoria -= 5
    cpuProceso = null
  } else if (algoritmo == RR && cuantumUsado >= quantum && tiempoRestante > 0) {
    cpuProceso.estado = READY
    colaReady.agregar(cpuProceso)
    cpuProceso = null
  }
}
```

---

## 🔌 Interfaz de Procesos

```javascript
{
  id: "abc12345",              // ID único
  nombre: "chrome",            // Nombre
  estado: "RUNNING",           // Estado actual
  tiempo: 3,                   // Tiempo ejecutado
  tiempoRestante: 5,          // Tiempo faltante
  duracion: 8,                // Duración total
  algoritmo: "rr",            // Algoritmo usado
  quantum: 2,                 // Quantum asignado
  cuantumUsado: 2,            // Quantum consumido
  infinito: true,             // ¿Es app? (no termina solo)
  createdAt: 1234567890       // Timestamp
}
```

---

## 💾 Comando → Función Mapping

| Comando | Función | Lógica |
|---------|---------|--------|
| `ejecutar` | executeCommand | Crea proceso, valida memoria |
| `procesos` | executeCommand | Lista tabla de procesos |
| `memoria` | executeCommand | Muestra uso/total |
| `kill` | executeCommand | Termina proceso, libera memoria |
| `crear` | executeCommand | Crea archivo .txt |
| `eliminar/rm` | executeCommand | Elimina archivo |
| `clear` | executeCommand | Limpia logs |
| `ayuda` | executeCommand | Muestra ayuda |

---

## 🎨 Paleta de Colores

### Estados de Proceso
```
NEW       → gray-600   (Gris apagado)
READY     → blue-500   (Azul claro)
RUNNING   → green-500  (Verde brillante)
WAITING   → yellow-500 (Amarillo)
TERMINATED→ red-600    (Rojo oscuro)
```

### Elementos UI
```
Primary    → Blue-500    (Botones, highlights)
Secondary  → Indigo-400  (Cards, backgrounds)
Success    → Green-500   (Procesos running)
Warning    → Yellow-500  (Advertencias)
Error      → Red-600     (Errores, kill)
Background → #0a0e27     (Fondo oscuro)
Text       → #e0e7ff     (Azul claro)
```

---

## 📊 Performance

### Optimizaciones Realizadas
1. **Component Memoization**: ProcessCard es puro, sin re-renders innecesarios
2. **State Updates**: Minimal spread operators, updates focused
3. **CSS Animations**: GPU-accelerated transforms
4. **Scheduler**: Eficiente con array slicing

### Limitaciones de Rendimiento
- Max ~50 procesos simultáneos (recomendado)
- Timer del navegador puede variar ±100ms
- Sin virtualización de lista (procesos grid simple)

---

## 🔍 Debugging

### Variables Útiles en Console
```javascript
// En App.jsx, puedes inspeccionar:
systemState.procesos       // Array de todos los procesos
systemState.colaReady      // Procesos esperando
systemState.cpuProceso     // Proceso en ejecución
systemState.memoria        // Memoria usada

// Ejemplo en console
console.log(systemState)   // Ver estado completo
```

### Tips de Debugging
1. Abre DevTools (F12)
2. Tab "Console"
3. Ejecuta: `console.log(JSON.stringify(systemState, null, 2))`
4. Ver estado en tiempo real

---

## 🚀 Extensiones Futuras

### Módulos que podrían agregarse
- [ ] Sincronización (semáforos, mutex)
- [ ] I/O Blocking (WAITING state real)
- [ ] Deadlock detection
- [ ] Paginación de memoria
- [ ] Prioridades de procesos
- [ ] Estadísticas (contextos, espera promedio)

### Mejoras de UI
- [ ] Gráficos de estadísticas con Chart.js
- [ ] Timeline visual de ejecución
- [ ] Modo responsivo mejorado
- [ ] Temas (light/dark)

---

## 📝 Convenciones de Código

### Naming
- `camelCase` para variables y funciones
- `PascalCase` para componentes React
- `UPPER_SNAKE_CASE` para constantes
- Prefijo `set` para setters de useState

### Estructura de Funciones
1. JSDoc comments
2. Validaciones
3. Lógica principal
4. Return statement

### CSS Class Naming
- `.component-name` para componentes
- `.component__element` para elementos
- `.component--state` para variantes

---

## 🎓 Propósito Educativo

Este proyecto demuestra:

✅ Estructuras de datos (colas, arrays)  
✅ Algoritmos de planificación (FIFO, RR)  
✅ Máquinas de estados  
✅ Manejo de memoria  
✅ Reactividad con React  
✅ Diseño responsive  
✅ Buenas prácticas de código  

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0
