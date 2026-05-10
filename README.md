# Mini OS - Simulación Visual de Componentes de un Sistema Operativo

## 📋 Descripción General

Simulación visual e interactiva de un **Sistema Operativo** desarrollada en **React + JavaScript**, que representa de forma gráfica y funcional el comportamiento interno de los componentes fundamentales del SO.

### Módulos Implementados

Se implementaron los **3 módulos principales** más fundamentales:

#### 1. **Gestión de Procesos** (Process Management)
- Estados del proceso: NEW → READY → RUNNING → WAITING → TERMINATED
- Creación y terminación de procesos
- Visualización clara de cada estado con colores diferentes
- Información en tiempo real: PID, nombre, duración, tiempo ejecutado

#### 2. **Planificación de CPU** (CPU Scheduling)
Implementa dos algoritmos de planificación:

- **FIFO (First In First Out)**
  - Procesos se ejecutan en el orden que llegan
  - Sin desalojo de contexto
  - Algoritmo más simple

- **Round Robin (RR)**
  - Cada proceso obtiene un quantum de tiempo
  - Al agotarse el quantum, regresa a Ready
  - Más justo y eficiente que FIFO
  - Configurable: quantum por defecto 3s, personalizable

Visualización en tiempo real del CPU ejecutando procesos con barras de progreso.

#### 3. **Gestión de Memoria** (Memory Management)
- Asignación dinámica de memoria (5MB por proceso)
- Liberación automática al terminar el proceso
- Visualización de uso en tiempo real: MB/Total
- Barra de progreso con porcentaje
- Límite máximo: 50MB

---

## 🎯 Características Principales

### Terminal Interactiva
- Interfaz de línea de comandos estilo Unix
- Logs en tiempo real del sistema
- Ejecución de comandos instantánea

### Panel de Monitoreo del Sistema
- **CPU**: Muestra proceso actual ejecutándose con barra de progreso
- **Memoria**: Uso dinámico con visualización gráfica
- **Estado del Sistema**: Conteo de procesos, Ready, Ejecutando, Finalizados
- **Lista de Procesos**: Grid dinámico con cards de cada proceso

### Escritorio Virtual
- Iconos de aplicaciones y archivos
- Ventanas flotantes y arrastrables
- Sistema de archivos básico (crear, eliminar, leer)
- Aplicaciones multitarea

---

## 📝 Comandos Disponibles

```bash
# Crear y ejecutar un proceso
ejecutar <nombre> [-algoritmo fifo|rr] [-quantum N]
  Ejemplos:
  ejecutar chrome
  ejecutar vscode -algoritmo rr -quantum 2
  ejecutar myapp -algoritmo fifo

# Listar todos los procesos
procesos

# Ver uso de memoria
memoria

# Terminar un proceso
kill <nombre>

# Gestión de archivos
crear <archivo.txt>          # Crear archivo
eliminar <archivo.txt>       # Eliminar archivo
rm <archivo.txt>             # Alias para eliminar

# Utilidades
clear                         # Limpiar terminal
ayuda                         # Mostrar ayuda
help                          # Alias para ayuda
```

---

## 🚀 Inicio Rápido

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/jeam256/mini-os.git
cd mini-os

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

### Uso Básico
1. Abre la terminal (lado izquierdo)
2. Escribe: `ejecutar chrome`
3. Observa cómo aparece el proceso en Ready
4. El Scheduler lo lleva a Running automáticamente
5. Monitorea en el panel derecho: CPU, Memoria, Procesos

---

## 🏗️ Arquitectura del Proyecto

```
mini-os/
├── src/
│   ├── App.jsx              # Componente principal
│   ├── system.js            # Lógica del SO (scheduler, comandos, estados)
│   ├── main.jsx             # Entry point
│   ├── styles.css           # Estilos (dark theme profesional)
│   ├── App.css              # CSS adicional del app
│   └── index.css            # CSS global
├── public/                  # Assets estáticos
├── index.html               # HTML principal
├── package.json             # Dependencias
├── vite.config.js           # Configuración Vite
└── README.md               # Este archivo
```

### Estructura de system.js

**Constantes y Configuración:**
- `PROCESS_STATES`: Estados (NEW, READY, RUNNING, WAITING, TERMINATED)
- `SCHEDULING_ALGORITHMS`: FIFO, ROUND_ROBIN
- `MEMORY_MAX`: 50 MB
- `MEMORY_PER_PROCESS`: 5 MB

**Funciones Principales:**
- `executeCommand()`: Procesa comandos del usuario
- `tickScheduler()`: Ejecuta 1 ciclo del scheduler (cada 1 segundo)
- `buildProcess()`: Crea una nueva estructura de proceso
- `parseCommand()`: Parsea argumentos de línea de comandos

---

## 💡 Ejemplos de Uso

### Ejemplo 1: FIFO Simple
```bash
ejecutar app1
ejecutar app2
ejecutar app3
procesos
```
*Los procesos se ejecutan en orden: app1, después app2, después app3*

### Ejemplo 2: Round Robin
```bash
ejecutar chrome -algoritmo rr -quantum 3
ejecutar vscode -algoritmo rr -quantum 2
procesos
```
*Cada proceso usa su quantum, luego regresa a Ready si no terminó*

### Ejemplo 3: Monitoreo de Memoria
```bash
ejecutar app1
ejecutar app2
ejecutar app3
ejecutar app4
memoria
kill app2
memoria
```
*Observa cómo libera 5 MB al hacer kill app2*

---

## 🎨 Interfaz Visual

### Colores de Estados
- 🟦 **READY**: Azul - Esperando CPU
- 🟩 **RUNNING**: Verde - En ejecución (con animación)
- 🟨 **WAITING**: Amarillo - Esperando recurso
- 🟥 **TERMINATED**: Rojo - Finalizado
- 🟩 **NEW**: Gris - Recién creado

### Barras de Progreso
- CPU: Barra azul que avanza según tiempo ejecutado
- Memoria: Barra naranja-rosa con porcentaje

---

## 📊 Detalles Técnicos

### Scheduler (system.js)
El scheduler se ejecuta cada 1000ms (1 segundo) y:

1. **Selección**: Si CPU está libre y hay procesos en Ready, carga el siguiente
2. **Ejecución**: Decrementa `tiempoRestante` del proceso actual
3. **Cambio de Contexto**:
   - Para FIFO: Solo cuando termina el proceso
   - Para RR: Cuando agota quantum o termina

### Estados Transiciones
```
NEW → READY → RUNNING ─┬→ TERMINATED (fin)
                       └→ READY (RR, quantum agotado)
```

### Manejo de Memoria
- Al crear proceso: memoria += 5
- Al terminar: memoria -= 5
- Validación: No permite crear si (memoria + 5) > 50

---

## 🔍 Testing & Validación

### Tests Sugeridos
1. **FIFO vs Round Robin**: Observa diferencia en tiempos
2. **Límite de Memoria**: Intenta crear más de 10 procesos
3. **Cambio Dinámico**: Ejecuta, mata procesos, ejecuta más
4. **Archivos**: Crea, lista y elimina archivos

---

## 📝 Notas de Implementación

### Points Clave
- ✅ Scheduler correctamente implementado
- ✅ Dos algoritmos de planificación funcionales
- ✅ Visualización clara y profesional
- ✅ Gestión de memoria dinámica
- ✅ Sistema de archivos básico
- ✅ Interfaz responsive y moderna
- ✅ Código estructurado y documentado

### Limitaciones Conocidas
- Simulación de procesos sin I/O real
- Memoria no es de verdad asignada en el sistema
- No hay sincronización ni locks reales
- Timer es del navegador (no exacto)

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18.3
- **Bundler**: Vite 5.4
- **Lenguaje**: JavaScript (ES6+)
- **Estilos**: CSS3 puro (sin frameworks)
- **UI**: Dark theme profesional con glassmorphism

---

## 📚 Referencias

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Operating Systems Concepts](https://www.os-book.com/)

---

## 👥 Autor

Mini OS - Proyecto Final de Sistemas Operativos
Universidad Rafael Landívar
Ingeniería en Informática y Sistemas

---

## 📄 Licencia

Este proyecto es de código educativo y puede ser modificado libremente para fines académicos.

---

**Última actualización**: Mayo 2026