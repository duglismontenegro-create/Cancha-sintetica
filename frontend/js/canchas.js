/**
 * canchas.js - Catálogo visual de canchas
 * GET /api/canchas  -> muestra Disponibles y Mantenimiento
 * Gestiona filtros y render de cards
 */

let todasLasCanchas = [];
let filtroActual = "Todas";

async function cargarCanchas() {
    const grid = document.getElementById("grid-canchas");
    const countEl = document.getElementById("count-canchas");

    grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:2rem;'>Cargando canchas...</p>";

    try {
        // 👉 PUNTO DE CONEXIÓN BACKEND - Catálogo público (no requiere token)
        const resp = await fetch(API.canchas, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
            // Si quieres filtrar desde backend: fetch(`${API.canchas}?estado=Disponible`)
        });
        const data = await resp.json();

        if (!resp.ok || !data.ok) {
            grid.innerHTML = `<p style='color:red; text-align:center;'>Error: ${data.msg}</p>`;
            return;
        }

        todasLasCanchas = data.canchas;
        renderCanchas(todasLasCanchas);

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style='color:red; text-align:center; grid-column:1/-1;'>
            Error de conexión con el backend.<br>
            Verifica que Flask esté corriendo en <b>${API_BASE_URL}</b><br>
            <small>${err.message}</small>
        </p>`;
    }
}

function renderCanchas(canchas) {
    const grid = document.getElementById("grid-canchas");
    const countEl = document.getElementById("count-canchas");

    let lista = canchas;
    if (filtroActual !== "Todas") {
        lista = canchas.filter(c => {
            if (filtroActual === "Disponible" || filtroActual === "Mantenimiento") return c.estado === filtroActual;
            // Filtros por tipo Fútbol 5,7,8,11
            return c.tipo === filtroActual;
        });
    }

    if (countEl) countEl.textContent = `${lista.length} cancha(s) encontrada(s)`;
    if (lista.length === 0) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:2rem;'>No hay canchas en esta categoría.</p>";
        return;
    }

    grid.innerHTML = lista.map(c => {
        const disponible = c.estado === "Disponible";
        const badgeClass = disponible ? "badge-disponible" : "badge-mantenimiento";
        const badgeText = disponible ? "● Disponible" : "● Mantenimiento";
        const precioFormateado = Number(c.precio_por_hora).toLocaleString('es-CO');
        const btn = disponible
            ? `<button class="btn btn-primary" onclick="abrirModalReserva(${c.id}, '${c.nombre.replace(/'/g, "\\'")}', '${c.tipo}', ${c.precio_por_hora})">Reservar ahora — $${precioFormateado}/h</button>`
            : `<button class="btn btn-disabled" disabled>No disponible</button>`;

        return `
        <div class="card">
            <img src="${c.imagen_url || 'https://via.placeholder.com/400x250?text=Cancha'}" alt="${c.nombre}" onerror="this.src='https://via.placeholder.com/400x250?text=Cancha'">
            <div class="card-body">
                <div class="card-title">${c.nombre}</div>
                <div class="card-tipo">${c.tipo} • ${c.estado}</div>
                <div class="badges"><span class="badge ${badgeClass}">${badgeText}</span></div>
                <div class="precio"><span class="precio-valor">$${precioFormateado} COP</span><span class="precio-unidad">/ hora</span></div>
                <div style="font-size:0.78rem; color:#666; margin-bottom:0.7rem; background:#f8f9fa; padding:6px 8px; border-radius:6px; border:1px dashed #ddd; text-align:center;">
                    Ej: 1h = $${precioFormateado} &nbsp;•&nbsp; 2h = $${(Number(c.precio_por_hora)*2).toLocaleString('es-CO')}
                </div>
                <div class="desc">${c.descripcion || 'Cancha sintética profesional.'}</div>
                ${btn}
            </div>
        </div>`;
    }).join("");
}

function filtrarCanchas(filtro, btnEl) {
    filtroActual = filtro;
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderCanchas(todasLasCanchas);
}

// Actualiza navbar según sesión
function actualizarNavbar() {
    const navAuth = document.getElementById("nav-auth");
    if (!navAuth) return;
    const usuario = Token.getUsuario();
    if (usuario && Token.isLogged()) {
        navAuth.innerHTML = `
            <span>Hola, <b>${usuario.nombre}</b> <span class="badge-rol">${usuario.rol}</span></span>
            <a href="#" onclick="verMisReservas()">Mis reservas</a>
            <a href="#" onclick="logout()">Cerrar sesión</a>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login_cliente.html">Iniciar sesión (Cliente)</a>
            <a href="registro_cliente.html" style="background: var(--primary); padding: 6px 12px; border-radius: 6px;">Registrarse</a>
            <a href="login_admin.html" style="opacity:0.7; font-size:0.85rem;">Admin</a>
        `;
    }
}

async function verMisReservas() {
    if (!Token.isLogged()) { alert("Debes iniciar sesión para ver tus reservas"); return; }
    if (Token.getUsuario().rol !== "cliente") { alert("Solo clientes tienen reservas"); return; }

    const modal = document.getElementById("modal-mis-reservas");
    const listaEl = document.getElementById("mis-reservas-lista");
    const msgEl = document.getElementById("mis-reservas-msg");
    if (modal) modal.classList.add("open");
    if (listaEl) listaEl.innerHTML = `<p style="text-align:center; padding:1rem;">Cargando reservas...</p>`;
    if (msgEl) msgEl.innerHTML = "";

    try {
        const resp = await fetch(API.misReservas, { headers: authHeaders() });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            if (listaEl) listaEl.innerHTML = `<div class="alert alert-error">${data.msg || "Error al cargar"}</div>`;
            return;
        }
        if (data.reservas.length === 0) {
            if (listaEl) listaEl.innerHTML = `<div class="alert alert-success">Aún no tienes reservas. ¡Reserva tu primera cancha!</div>`;
            return;
        }

        let totalConfirmado = data.reservas.filter(r=>r.estado==="Confirmada").reduce((acc,r)=>acc+Number(r.costo_total),0);
        let html = data.reservas.map(r => {
            const costoFmt = Number(r.costo_total).toLocaleString('es-CO');
            let badgeClass = "badge-disponible";
            let badgeText = r.estado;
            if (r.estado === "Cancelada") { badgeClass = "badge-cancelada"; }
            else if (r.estado === "Pendiente") { badgeClass = "badge-pendiente"; }

            const esConfirmada = r.estado === "Confirmada";

            // NUEVA LÓGICA: Si Confirmada → ambos botones bloqueados (ya no se puede oprimir nada)
            // Si Pendiente/Cancelada (caso borde) → Confirmar = PUT Confirmada (bloquea), Cancelar = DELETE borra de BD
            let btnConfirmar, btnCancelar;
            if (esConfirmada) {
                btnConfirmar = `<button class="btn btn-disabled" disabled title="Ya confirmada y bloqueada">✅ Confirmada — Bloqueada</button>`;
                btnCancelar = `<button class="btn btn-disabled" disabled title="Reserva bloqueada, no se puede cancelar/borrar">🔒 Bloqueada</button>`;
            } else {
                btnConfirmar = `<button class="btn btn-success" onclick="cambiarEstadoReservaCliente(${r.id}, 'Confirmada')">✅ Confirmar</button>`;
                btnCancelar = `<button class="btn btn-danger" onclick="borrarReservaCliente(${r.id})">❌ Cancelar y Borrar</button>`;
            }

            return `
            <div class="mis-reserva-card" style="${esConfirmada ? 'opacity:0.85; border-color:#badbcc; background:#f0faf4;' : ''}">
                <div class="row">
                    <div class="info">
                        <b>#${r.id} — ${r.cancha_nombre}</b> <small>(${r.tipo})</small><br>
                        📅 ${r.fecha} &nbsp; ⏰ ${r.hora_inicio} → ${r.hora_fin} (${r.duracion_horas}h)<br>
                        💰 <b style="color:var(--primary);">$${costoFmt} COP</b> &nbsp; <span class="badge ${badgeClass}">${badgeText}</span>
                        ${esConfirmada ? '<br><small style="color:var(--success); font-weight:700;">🔒 Confirmada — ya no se puede modificar</small>' : ''}
                    </div>
                </div>
                <div class="mis-reserva-actions">
                    ${btnConfirmar}
                    ${btnCancelar}
                </div>
                <small style="color:#888; font-size:0.75rem; display:block; margin-top:6px;">ID ${r.id} • ${esConfirmada ? 'Bloqueada en BD <code>reservas.estado=Confirmada</code>' : 'Confirmar bloquea • Cancelar borra de BD (<code>DELETE</code>)'}</small>
            </div>`;
        }).join("");

        html += `<div style="background:#f8f9fa; border:1px solid #e9ecef; padding:10px; border-radius:8px; text-align:center; margin-top:1rem;">
            <b>${data.reservas.length} reserva(s)</b> &nbsp;|&nbsp; 💰 Total en Confirmadas: <b style="color:var(--primary);">$${totalConfirmado.toLocaleString('es-CO')} COP</b>
        </div>`;
        if (listaEl) listaEl.innerHTML = html;

    } catch (e) {
        if (listaEl) listaEl.innerHTML = `<div class="alert alert-error">Error de red: ${e.message} — Verifica Flask en ${API_BASE_URL}</div>`;
    }
}

function cerrarModalMisReservas() {
    const modal = document.getElementById("modal-mis-reservas");
    if (modal) modal.classList.remove("open");
}

async function cambiarEstadoReservaCliente(reservaId, nuevoEstado) {
    // Solo se usa para CONFIRMAR ahora (Cancelar usa DELETE)
    if (nuevoEstado !== "Confirmada") return;
    if (!confirm(`¿Seguro que quieres CONFIRMAR la reserva #${reservaId}?\n\nSe guardará en BD como 'Confirmada' y quedará BLOQUEADA (no podrás cancelarla ni modificarla).`)) return;

    const msgEl = document.getElementById("mis-reservas-msg");
    if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">Confirmando y bloqueando...</div>`;

    try {
        const resp = await fetch(API.cambiarEstadoReserva(reservaId), {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ estado: "Confirmada" })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">❌ ${data.msg || "Error"}</div>`;
            return;
        }
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">✅ ${data.msg} — Ahora está bloqueada.</div>`;
        setTimeout(() => verMisReservas(), 600);
    } catch (e) {
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">❌ Error de red: ${e.message}</div>`;
    }
}

async function borrarReservaCliente(reservaId) {
    if (!confirm(`¿Seguro que quieres CANCELAR y BORRAR la reserva #${reservaId}?\n\nSe ELIMINARÁ de la BD (DELETE FROM reservas) y el horario quedará libre para otros. Esta acción no se puede deshacer.`)) return;

    const msgEl = document.getElementById("mis-reservas-msg");
    if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">Borrando de la BD...</div>`;

    try {
        const resp = await fetch(API.borrarReserva(reservaId), {
            method: "DELETE",
            headers: authHeaders()
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">❌ ${data.msg || "Error al borrar"}</div>`;
            return;
        }
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">🗑️ ${data.msg}</div>`;
        setTimeout(() => verMisReservas(), 600);
    } catch (e) {
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">❌ Error de red: ${e.message}</div>`;
    }
}

// Cerrar modal al click fuera
document.addEventListener("click", (e) => {
    const overlay = document.getElementById("modal-mis-reservas");
    if (overlay && e.target === overlay) cerrarModalMisReservas();
});

// Inicialización automática si existe grid-canchas
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("grid-canchas")) {
        cargarCanchas();
    }
    actualizarNavbar();
});
