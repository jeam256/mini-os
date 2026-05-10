# Guía Rápida - Mini OS

## ⚡ Inicio en 30 segundos

### 1. Instalar y Ejecutar
```bash
npm install
npm run dev
```

### 2. Abrir en navegador
```
http://localhost:5173
```

---

## 🎮 Uso Básico (Ejemplos)

### Primer Proceso
```bash
ejecutar chrome
```
✅ Aparecerá en Ready, luego Running en el panel derecho

### Procesos con Algoritmo
```bash
ejecutar chrome -algoritmo fifo
ejecutar vscode -algoritmo rr -quantum 2
ejecutar app1 -algoritmo rr -quantum 3
```

### Ver Estado
```bash
procesos          # Lista todos los procesos
memoria           # Muestra uso de memoria
```

### Detener Proceso
```bash
kill chrome       # Termina proceso chrome
```

### Gestión de Archivos
```bash
crear miarchivo.txt    # Crea archivo
eliminar miarchivo.txt # Elimina archivo
```

### Limpiar
```bash
clear             # Limpia la terminal
```

---

## 📊 Leyenda Visual

### Colores de Procesos
| Color | Estado | Significado |
|-------|--------|-------------|
| 🔵 Gris | NEW | Recién creado |
| 🔵 Azul | READY | Esperando CPU |
| 🟢 Verde | RUNNING | En ejecución (¡brillante!) |
| 🟡 Amarillo | WAITING | Esperando |
| 🔴 Rojo | TERMINATED | Finalizado |

### Panel Derecho
- **CPU**: Muestra qué proceso se está ejecutando
- **Memoria**: Barra visual de uso (naranja/rosa)
- **Estado**: Contadores de procesos
- **Procesos**: Grid con todos los procesos activos

---

## 🧪 Experimentos Rápidos

### Experimento 1: FIFO vs RR
```bash
# Abre 2 terminales o pestaña

# Terminal 1: FIFO
ejecutar task1 -algoritmo fifo
ejecutar task2 -algoritmo fifo
ejecutar task3 -algoritmo fifo

# Observa: Se ejecutan secuencialmente
procesos

# Terminal 2: RR
ejecutar app1 -algoritmo rr -quantum 2
ejecutar app2 -algoritmo rr -quantum 2
ejecutar app3 -algoritmo rr -quantum 2

# Observa: Se intercalan los procesos
```

### Experimento 2: Estrés de Memoria
```bash
ejecutar p1    # 5 MB
ejecutar p2    # 10 MB
ejecutar p3    # 15 MB
ejecutar p4    # 20 MB
ejecutar p5    # 25 MB
ejecutar p6    # 30 MB
ejecutar p7    # 35 MB
ejecutar p8    # 40 MB
ejecutar p9    # 45 MB
ejecutar p10   # 50 MB
ejecutar p11   # ❌ ERROR: Memoria insuficiente

memoria        # Mostrará: 50/50 MB (100%)
kill p5        # Libera 5 MB
ejecutar p11   # ✅ Ahora funciona
```

### Experimento 3: Visualización en Tiempo Real
1. Ejecuta: `ejecutar longprocess -algoritmo rr -quantum 2`
2. Observa en tiempo real:
   - CPU status: Muestra progreso
   - Proceso card: Parpadea (animación)
   - Tiempo actual: Se actualiza cada segundo

---

## 🔧 Configuración Avanzada

### Quantum Personalizado (Round Robin)
```bash
ejecutar app -algoritmo rr -quantum 1   # Muy frecuente
ejecutar app -algoritmo rr -quantum 5   # Menos frecuente
ejecutar app -algoritmo rr -quantum 10  # Muy largo
```

**Nota**: Quantum por defecto es 3 segundos

### Crear Procesos Realistas
```bash
# Aplicación típica
ejecutar chrome -algoritmo rr -quantum 2

# Proceso del sistema
ejecutar system -algoritmo fifo

# Servidor
ejecutar server -algoritmo rr -quantum 5
```

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué un proceso no termina?**  
R: Si ejecutaste una app (chrome, vscode), son procesos "infinitos". Úsalos para ver cómo viven indefinidamente. Para terminar: `kill chrome`

**P: ¿Qué diferencia hay entre FIFO y RR?**  
R: FIFO espera a que termine cada proceso. RR le da un tiempo (quantum) y luego lo manda atrás de la cola.

**P: ¿Puedo cambiar la memoria máxima?**  
R: Sí, en `system.js` busca `MEMORY_MAX = 50` y cámbialo

**P: ¿Por qué la memoria sube?**  
R: Cada proceso toma 5 MB. Se libera cuando termina (`kill` o tiempo agotado).

**P: ¿Dónde veo los archivos?**  
R: En el lado derecho, en el escritorio. Haz doble click para abrir.

---

## 🚨 Troubleshooting

### El terminal no responde
```bash
# Presiona Ctrl+C y reinicia
npm run dev
```

### Memoria no se libera
```bash
# Mata el proceso
kill nombredelProceso

# Verifica
memoria
```

### Procesos no aparecen
```bash
procesos  # Listar todos
# Si está vacío, crea uno: ejecutar chrome
```

---

## 📚 Aprende Más

- Lee [README.md](./README.md) para documentación completa
- Modifica [src/system.js](./src/system.js) para ajustar comportamiento
- Edita [src/styles.css](./src/styles.css) para cambiar colores/diseño

---

**¡Disfruta la simulación! 🎉**
