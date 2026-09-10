/**
 * reserva.js - Flujo de Reserva y ventana post-reserva
 * 
 * 1. abrirModalReserva() -> muestra formulario (fecha, hora_inicio, duración)
 * 2. confirmarReserva()  -> POST /api/reservas con token obligatorio
 * 3. mostrarResumenReserva() -> ventana detallada con instrucciones de pago,
 *                               tiempo límite llegada (15 min antes), resumen tiempo y costo
 */

// Estado temporal de la cancha seleccionada
let canchaSeleccionada = null;

function abrirModalReserva(id, nombre, tipo, precioHora) {
    // 🔒 SEGURIDAD: Obligatorio estar logueado
    if (!Token.isLogged()) {
        alert("Debes iniciar sesión como Cliente para reservar una cancha.");
        window.location.href = "login_cliente.html";
        return;
    }
    const usuario = Token.getUsuario();
    if (usuario.rol !== "cliente") {
        alert("Solo los clientes pueden reservar. Los administradores deben usar una cuenta de cliente.");
        return;
    }

    canchaSeleccionada = { id, nombre, tipo, precioHora };

    // Setea fecha mínima = hoy
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("reserva-fecha").min = hoy;
    document.getElementById("reserva-fecha").value = hoy;

    document.getElementById("modal-cancha-nombre").textContent = `${nombre} (${tipo})`;
    document.getElementById("modal-precio").textContent = `$${Number(precioHora).toLocaleString('es-CO')} / hora`;

    // Limpia mensajes previos
    document.getElementById("reserva-msg").innerHTML = "";
    document.getElementById("resumen-reserva").style.display = "none";
    document.getElementById("form-reserva").style.display = "block";
    document.getElementById("reserva-hora").value = "18:00";
    document.getElementById("reserva-duracion").value = "1";

    document.getElementById("modal-reserva").classList.add("open");
}

function cerrarModalReserva() {
    document.getElementById("modal-reserva").classList.remove("open");
    canchaSeleccionada = null;
}

function actualizarCostoEstimado() {
    if (!canchaSeleccionada) return;
    const dur = parseFloat(document.getElementById("reserva-duracion").value) || 0;
    const total = canchaSeleccionada.precioHora * dur;
    document.getElementById("costo-estimado").textContent = `$${total.toLocaleString('es-CO')} COP`;
}

// Listeners para costo dinámico
document.addEventListener("DOMContentLoaded", () => {
    const durEl = document.getElementById("reserva-duracion");
    if (durEl) durEl.addEventListener("change", actualizarCostoEstimado);
});

async function confirmarReserva(event) {
    if (event) event.preventDefault();

    const fecha = document.getElementById("reserva-fecha").value;
    const hora_inicio = document.getElementById("reserva-hora").value; // "14:00"
    const duracion_horas = document.getElementById("reserva-duracion").value;
    const msgEl = document.getElementById("reserva-msg");

    if (!fecha || !hora_inicio || !duracion_horas) {
        msgEl.innerHTML = `<div class="alert alert-error">Completa fecha, hora y duración</div>`;
        return;
    }

    // Validación hora
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(hora_inicio)) {
        msgEl.innerHTML = `<div class="alert alert-error">Hora inválida (formato HH:MM)</div>`;
        return;
    }

    msgEl.innerHTML = `<div class="alert alert-success">Procesando reserva...</div>`;

    try {
        // 👉 PUNTO DE CONEXIÓN BACKEND - REQUIERE TOKEN CLIENTE
        const resp = await fetch(API.reservas, {
            method: "POST",
            headers: authHeaders(), // <--- incluye Authorization: Bearer <token>
            body: JSON.stringify({
                cancha_id: canchaSeleccionada.id,
                fecha: fecha,
                hora_inicio: hora_inicio,
                duracion_horas: parseFloat(duracion_horas)
            })
        });

        const data = await resp.json();

        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || "Error al reservar"}</div>`;
            return;
        }

        // ÉXITO -> Mostrar ventana detallada post-reserva
        mostrarResumenReserva(data);

    } catch (err) {
        console.error(err);
        msgEl.innerHTML = `<div class="alert alert-error">Error de red: ${err.message}. Verifica backend en ${API_BASE_URL}</div>`;
    }
}

function mostrarResumenReserva(data) {
    // Oculta form, muestra resumen
    document.getElementById("form-reserva").style.display = "none";
    const box = document.getElementById("resumen-reserva");
    const r = data.reserva;

    // Formatea hora de llegada recomendada (15 min antes)
    // data.tiempo_llegada ya viene del backend

    box.innerHTML = `
        <div style="text-align:center; margin-bottom:1rem;">
            <div style="font-size:2.2rem;">✅</div>
            <h3 style="color: var(--success);">¡Reserva Confirmada!</h3>
            <small>ID Reserva #${r.id} • Estado: Confirmada</small>
        </div>

        <div class="resumen-box">
            <strong>📋 Resumen de tu reserva:</strong><br>
            <b>Cancha:</b> ${r.cancha} (${r.tipo})<br>
            <b>Fecha:</b> ${r.fecha}<br>
            <b>Horario:</b> ${r.hora_inicio} → ${r.hora_fin} (${r.duracion_horas} hora(s))<br>
            <b>Costo estimado:</b> $${Number(r.costo_total).toLocaleString('es-CO')} COP<br>
            <em style="font-size:0.85rem; color:#555;">${data.resumen}</em>
        </div>

        <div class="resumen-box" style="background:#fff3cd; border-color:#ffecb5;">
            <strong>⏰ Tiempo límite de llegada:</strong><br>
            ${data.tiempo_llegada}<br>
            <small>Si llegas tarde, tu reserva podría ser reasignada. Llega con tiempo para equiparte.</small>
        </div>

        <div class="resumen-box" style="background:#d1e7dd; border-color:#badbcc;">
            <strong>💳 Instrucciones de pago:</strong><br>
            ${data.instrucciones_pago}<br>
            <small>Presenta el ID de reserva <b>#${r.id}</b> al pagar.</small>
        </div>

        <div class="modal-actions">
            <button class="btn btn-primary" onclick="cerrarModalReserva()">Entendido</button>
            <button class="btn btn-outline" onclick="verMisReservas(); cerrarModalReserva();">Ver mis reservas</button>
        </div>
    `;
    box.style.display = "block";
}

// Cerrar modal al click fuera
document.addEventListener("click", (e) => {
    const overlay = document.getElementById("modal-reserva");
    if (overlay && e.target === overlay) cerrarModalReserva();
});
