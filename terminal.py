import tkinter as tk
from tkinter import scrolledtext
import random
import time


# ================================
# VARIABLES DEL SISTEMA
# ================================
procesos = []
cola_ready = []
cpu_proceso = None

iconos = {
    "terminal": "🖥",
    "chrome": "🌐",
    "whatsapp": "💬",
    "spotify": "🎵",
    "vscode": "🧠"
}

apps_activas = []

memoria = 0
memoria_max = 30

# ================================
# VENTANA
# ================================
root = tk.Tk()
root.title("Mini Sistema Operativo")
root.geometry("900x500")

barra = tk.Frame(root, bg="#222", height=40)
barra.pack(side="bottom", fill="x")

label_apps = tk.Label(barra, text="", fg="white", bg="#222")
label_apps.pack(side="left", padx=10)

label_hora = tk.Label(barra, text="", fg="white", bg="#222")
label_hora.pack(side="right", padx=10)

# ================================
# TERMINAL (IZQUIERDA)
# ================================
frame_terminal = tk.Frame(root, bg="black")
frame_terminal.pack(side="left", fill="both", expand=True)

terminal = scrolledtext.ScrolledText(frame_terminal, bg="black", fg="white")
terminal.pack(fill="both", expand=True)

entrada = tk.Entry(
    frame_terminal,
    bg="black",
    fg="lime",
    insertbackground="lime",
    font=("Consolas", 12)
)
entrada.pack(fill="x")

# ================================
# PANEL SISTEMA (DERECHA)
# ================================
frame_sistema = tk.Frame(root, bg="#111")
frame_sistema.pack(side="right", fill="both", expand=True)

label_cpu = tk.Label(frame_sistema, text="CPU: Idle", fg="white", bg="#111")
label_cpu.pack(anchor="w")

label_memoria = tk.Label(frame_sistema, text="Memoria: 0/30", fg="white", bg="#111")
label_memoria.pack(anchor="w")

label_ready = tk.Label(frame_sistema, text="READY:", fg="cyan", bg="#111")
label_ready.pack(anchor="w")

label_running = tk.Label(frame_sistema, text="RUNNING:", fg="yellow", bg="#111")
label_running.pack(anchor="w")

label_finished = tk.Label(frame_sistema, text="FINISHED:", fg="gray", bg="#111")
label_finished.pack(anchor="w")

# ================================
# FUNCIONES
# ================================
def escribir_terminal(texto):
    terminal.insert(tk.END, texto + "\n")
    terminal.see(tk.END)

def parsear_comando(cmd):
    partes = cmd.split()
    if len(partes) == 0:
        return None, None, {}

    comando = partes[0]
    nombre = partes[1] if len(partes) > 1 else None

    params = {}
    i = 2
    while i < len(partes):
        if partes[i].startswith("-"):
            clave = partes[i]
            valor = partes[i+1] if i+1 < len(partes) else True
            params[clave] = valor
            i += 2
        else:
            i += 1

    return comando, nombre, params

# ================================
# COMANDOS
# ================================
def ejecutar_comando(event):
    global memoria, cpu_proceso

    cmd = entrada.get()
    entrada.delete(0, tk.END)

    escribir_terminal("MiSO> " + cmd)

    comando, nombre, params = parsear_comando(cmd)

    if comando == "ejecutar":
        es_app = nombre in iconos

        if nombre not in apps_activas and es_app:
            apps_activas.append(nombre)

        if memoria + 5 > memoria_max:
            escribir_terminal("ERROR: Memoria insuficiente")
            return

        if nombre not in iconos:
            escribir_terminal(f"{nombre} ejecutado como proceso en segundo plano")
            
        algoritmo = params.get("-algoritmo", "fifo")
        quantum = int(params.get("-quantum", 3))

        proceso = {
            "nombre": nombre,
            "estado": "READY",
            "tiempo": 0,
            "duracion": random.randint(5, 10),
            "algoritmo": algoritmo,
            "quantum": quantum,
            "infinito": es_app
        }

        procesos.append(proceso)
        cola_ready.append(proceso)
        memoria += 5

        escribir_terminal(f"Proceso {nombre} creado con {algoritmo.upper()}")

    elif comando == "procesos":
        for p in procesos:
            escribir_terminal(
                f"{p['nombre']} | {p['estado']} | {p['algoritmo']}"
            )

    elif comando == "memoria":
        escribir_terminal(f"Memoria: {memoria}/{memoria_max}")

    elif comando == "kill" and nombre:
        if nombre in apps_activas:
            apps_activas.remove(nombre)

        eliminado = False

        for p in procesos:
            if p["nombre"] == nombre:

                memoria = max(0, memoria - 5)

                if p in cola_ready:
                    cola_ready.remove(p)

                if cpu_proceso == p:
                    cpu_proceso = None

                procesos.remove(p)

                escribir_terminal(f"{nombre} eliminado y memoria liberada")
                eliminado = True
                break

        if not eliminado:
            escribir_terminal("Proceso no encontrado")

    elif comando == "clear":
        terminal.delete("1.0", tk.END)
    else:
        escribir_terminal("Comando no reconocido")

entrada.bind("<Return>", ejecutar_comando)

# ================================
# PLANIFICADOR (FIFO BASE)
# ================================
def scheduler():
    global cpu_proceso

    if cpu_proceso is None and cola_ready:
        cpu_proceso = cola_ready.pop(0)
        cpu_proceso["estado"] = "RUNNING"

    if cpu_proceso:
        cpu_proceso["tiempo"] += 1

        if not cpu_proceso["infinito"]:
            if cpu_proceso["tiempo"] >= cpu_proceso["duracion"]:
                cpu_proceso["estado"] = "FINISHED"

                global memoria
                memoria = max(0, memoria - 5)  # liberar memoria

                cpu_proceso = None

    actualizar_ui()
    root.after(1000, scheduler)

# ================================
# ACTUALIZAR UI
# ================================
def actualizar_ui():
    label_memoria.config(text=f"Memoria: {memoria}/{memoria_max}")

    if cpu_proceso:
        label_cpu.config(text=f"CPU: {cpu_proceso['nombre']}")
    else:
        label_cpu.config(text="CPU: Idle")

    ready = ", ".join([p["nombre"] for p in cola_ready])
    running = cpu_proceso["nombre"] if cpu_proceso else "Ninguno"
    finished = ", ".join([p["nombre"] for p in procesos if p["estado"] == "FINISHED"])

    label_ready.config(text=f"READY: {ready}")
    label_running.config(text=f"RUNNING: {running}")
    label_finished.config(text=f"FINISHED: {finished}")

def actualizar_barra():
    # Apps
    texto = ""
    for app in apps_activas:
        icono = iconos.get(app, "❓")
        texto += f"{icono} {app}   "

    label_apps.config(text=texto)

    # Hora
    hora = time.strftime("%H:%M:%S")
    label_hora.config(text=hora)

    root.after(1000, actualizar_barra)

# ================================
# INICIO
# ================================
scheduler()
actualizar_barra()
root.mainloop()