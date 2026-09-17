/**
 * admin.js - Lógica del Panel de Administrador
 * Rutas protegidas: GET /api/admin/canchas, PUT /api/admin/canchas/:id/estado, GET /api/admin/reservas
 * Todas requieren token con rol 'administrador'
 */

async function cargarPanelAdmin() {
    protegerPanelAdmin(); // verifica token admin

    // Mostrar nombre admin en header
    const usuario = Token.getUsuario();
    const infoEl = document.getElementById("admin-info");
    if (infoEl) infoEl.textContent = `${usuario.nombre} (${usuario.email})`;

    await Promise.all([cargarCanchasAdmin(), cargarReservasAdmin()]);
}

async function cargarCanchasAdmin() {
    const tbody = document.getElementById("tbody-canchas");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
    try {
        const resp = await fetch(API.adminCanchas, { headers: authHeaders() });
        let data;
        try { data = await resp.json(); } catch { throw new Error(`HTTP ${resp.status} - Respuesta no JSON. ¿Backend caído?`); }
        if (!resp.ok || !data.ok) {
            // Mensajes específicos para Failed fetch / 401 / 500
            let msg = data.msg || `HTTP ${resp.status}`;
            if (resp.status === 401) msg = "No autorizado. Token expirado o no eres admin. Vuelve a loguearte.";
            if (resp.status === 403) msg = "Acceso denegado. Solo administradores.";
            if (resp.status === 500) msg = "Error de BD. Verifica que MySQL esté corriendo y reservas_cancha exista.";
            tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">❌ ${msg}<br><small>API: ${API.adminCanchas}</small></td></tr>`;
            return;
        }
        if (data.canchas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay canchas. ¡Agrega una con el botón + Agregar Cancha!</td></tr>`;
            return;
        }
        // Guardar para edición
        window._canchasAdmin = data.canchas;
        tbody.innerHTML = data.canchas.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><b>${c.nombre}</b><br><small>${c.tipo}</small><br><small style="color:#888; display:block; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${(c.descripcion||'').replace(/"/g,'&quot;')}">${c.descripcion||'<em>sin descripción</em>'}</small></td>
                <td><span style="background:#dcfce7; border:1px solid #86efac; padding:4px 8px; border-radius:12px; font-weight:800; color:#14532d;">$${Number(c.precio_por_hora || 0).toLocaleString('es-CO')} COP</span><br><small style="color:#52525b;">/ hora</small></td>
                <td><span class="badge ${c.estado==='Disponible'?'badge-disponible':'badge-mantenimiento'}">${c.estado}</span></td>
                <td>
                    <select class="estado-select" onchange="cambiarEstadoCancha(${c.id}, this.value)">
                        <option value="Disponible" ${c.estado==='Disponible'?'selected':''}>Disponible</option>
                        <option value="Mantenimiento" ${c.estado==='Mantenimiento'?'selected':''}>Mantenimiento</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-primary" style="width:auto; padding:0.4rem 0.7rem; font-size:0.8rem;" onclick="abrirModalEditarCancha(${c.id})">✏️ Editar</button>
                </td>
            </tr>
        `).join("");
    } catch (e) {
        console.error("cargarCanchasAdmin failed", e);
        const isFetch = e.message.includes("Failed to fetch") || e.message.includes("NetworkError") || e.message.includes("Load failed");
        const detalle = isFetch
            ? `Failed to fetch: No se pudo conectar a <b>${API_BASE_URL}</b>.<br>1) Verifica que ejecutes <code>python app.py</code> en backend<br>2) Que no sea <code>file://</code> - usa Live Server (http://127.0.0.1:5500)<br>3) Que CORS esté habilitado`
            : e.message;
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">❌ Error de conexión<br><small>${detalle}</small></td></tr>`;
    }
}

async function cambiarEstadoCancha(id, nuevoEstado) {
    if (!confirm(`¿Cambiar cancha #${id} a "${nuevoEstado}"?`)) {
        cargarCanchasAdmin(); // recarga para revertir select
        return;
    }
    try {
        // 👉 PUT /api/admin/canchas/:id/estado
        const resp = await fetch(API.adminCambiarEstadoCancha(id), {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await resp.json();
        if (!data.ok) {
            alert("Error: " + data.msg);
            cargarCanchasAdmin();
            return;
        }
        // Recarga grilla
        cargarCanchasAdmin();
    } catch (e) {
        alert("Error de red: " + e.message);
    }
}

async function cargarReservasAdmin() {
    const tbody = document.getElementById("tbody-reservas");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
    try {
        const resp = await fetch(API.adminReservas, { headers: authHeaders() });
        let data;
        try { data = await resp.json(); } catch { throw new Error(`HTTP ${resp.status} - Respuesta no JSON`); }
        if (!resp.ok || !data.ok) {
            let msg = data.msg || `HTTP ${resp.status}`;
            if (resp.status === 401) msg = "No autorizado. Token expirado.";
            if (resp.status === 500) msg = "Error BD. Verifica MySQL y reservas_cancha.";
            tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">❌ ${msg}</td></tr>`;
            return;
        }
        if (data.reservas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay reservas aún.</td></tr>`;
            document.getElementById("count-reservas").textContent = `0 reservas`;
            return;
        }
        tbody.innerHTML = data.reservas.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${r.cancha_nombre}<br><small>${r.cancha_tipo}</small></td>
                <td>${r.cliente_nombre}<br><small>${r.cliente_email}</small></td>
                <td>${r.fecha}<br><small>${r.hora_inicio} - ${r.hora_fin} (${r.duracion_horas}h)</small></td>
                <td><b style="color:var(--primary);">$${Number(r.costo_total).toLocaleString('es-CO')} COP</b><br><small style="color:#666;">${r.duracion_horas}h</small></td>
                <td><span class="badge ${r.estado==='Confirmada'?'badge-disponible':'badge-mantenimiento'}">${r.estado}</span></td>
            </tr>
        `).join("");
        document.getElementById("count-reservas").textContent = `${data.reservas.length} reservas`;
    } catch (e) {
        console.error("cargarReservasAdmin failed", e);
        const isFetch = e.message.includes("Failed to fetch") || e.message.includes("NetworkError");
        const detalle = isFetch
            ? `Failed to fetch: No se pudo conectar a <b>${API_BASE_URL}</b>. Verifica <code>python app.py</code> y usa Live Server.`
            : e.message;
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">❌ Error de conexión<br><small>${detalle}</small></td></tr>`;
    }
}

// ====== AGREGAR CANCHA ======
function abrirModalCancha() {
    document.getElementById("cancha-msg").innerHTML = "";
    document.getElementById("cancha-nombre").value = "";
    document.getElementById("cancha-tipo").value = "Fútbol 5";
    document.getElementById("cancha-precio").value = "80000";
    document.getElementById("cancha-estado").value = "Disponible";
    document.getElementById("cancha-descripcion").value = "";
    document.getElementById("cancha-imagen").value = "";
    document.getElementById("modal-cancha").classList.add("open");
}
function cerrarModalCancha() {
    document.getElementById("modal-cancha").classList.remove("open");
}
async function crearCancha(event) {
    if (event) event.preventDefault();
    const nombre = document.getElementById("cancha-nombre").value.trim();
    const tipo = document.getElementById("cancha-tipo").value;
    const precio_por_hora = parseFloat(document.getElementById("cancha-precio").value);
    const estado = document.getElementById("cancha-estado").value;
    const descripcion = document.getElementById("cancha-descripcion").value.trim();
    const imagen_url = document.getElementById("cancha-imagen").value.trim();
    const msgEl = document.getElementById("cancha-msg");

    if (!nombre || !tipo || !precio_por_hora) {
        msgEl.innerHTML = `<div class="alert alert-error">Completa nombre, tipo y precio</div>`;
        return;
    }
    msgEl.innerHTML = `<div class="alert alert-success">Creando cancha...</div>`;
    try {
        const resp = await fetch(API.adminCrearCancha, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ nombre, tipo, estado, precio_por_hora, descripcion, imagen_url })
        });
        let data;
        try { data = await resp.json(); } catch { throw new Error(`HTTP ${resp.status} - Sin JSON`); }
        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || 'Error al crear'}</div>`;
            return;
        }
        msgEl.innerHTML = `<div class="alert alert-success">✅ Cancha #${data.id} creada. Actualizando lista...</div>`;
        setTimeout(() => {
            cerrarModalCancha();
            cargarCanchasAdmin();
        }, 800);
    } catch (e) {
        console.error(e);
        const isFetch = e.message.includes("Failed to fetch");
        const detalle = isFetch ? `Failed to fetch: backend no responde en ${API_BASE_URL}. Ejecuta <code>python app.py</code>` : e.message;
        msgEl.innerHTML = `<div class="alert alert-error">❌ ${detalle}</div>`;
    }
}
// ====== EDITAR CANCHA (precio, foto, descripcion) ======
let canchaEditandoId = null;

function abrirModalEditarCancha(id) {
    const lista = window._canchasAdmin || [];
    const cancha = lista.find(c => c.id === id);
    if (!cancha) { alert("Cancha no encontrada"); return; }
    canchaEditandoId = id;
    document.getElementById("editar-cancha-id").textContent = `#${id}`;
    document.getElementById("edit-cancha-nombre").value = cancha.nombre || "";
    document.getElementById("edit-cancha-tipo").value = cancha.tipo || "Fútbol 5";
    document.getElementById("edit-cancha-precio").value = cancha.precio_por_hora || 80000;
    document.getElementById("edit-cancha-estado").value = cancha.estado || "Disponible";
    document.getElementById("edit-cancha-descripcion").value = cancha.descripcion || "";
    document.getElementById("edit-cancha-imagen").value = cancha.imagen_url || "";
    const preview = document.getElementById("edit-cancha-preview");
    if (cancha.imagen_url) { preview.src = cancha.imagen_url; preview.style.display = "block"; } else { preview.style.display = "none"; }
    document.getElementById("edit-cancha-imagen").oninput = (e) => {
        const url = e.target.value.trim();
        if (url) { preview.src = url; preview.style.display = "block"; } else { preview.style.display = "none"; }
    };
    document.getElementById("edit-cancha-msg").innerHTML = "";
    document.getElementById("modal-editar-cancha").classList.add("open");
}
function cerrarModalEditarCancha() {
    document.getElementById("modal-editar-cancha").classList.remove("open");
    canchaEditandoId = null;
}
async function guardarEdicionCancha(event) {
    if (event) event.preventDefault();
    if (!canchaEditandoId) return;
    const nombre = document.getElementById("edit-cancha-nombre").value.trim();
    const tipo = document.getElementById("edit-cancha-tipo").value;
    const precio_por_hora = parseFloat(document.getElementById("edit-cancha-precio").value);
    const estado = document.getElementById("edit-cancha-estado").value;
    const descripcion = document.getElementById("edit-cancha-descripcion").value.trim();
    const imagen_url = document.getElementById("edit-cancha-imagen").value.trim();
    const msgEl = document.getElementById("edit-cancha-msg");
    if (!nombre || !precio_por_hora) {
        msgEl.innerHTML = `<div class="alert alert-error">Nombre y precio son obligatorios</div>`;
        return;
    }
    msgEl.innerHTML = `<div class="alert alert-success">Guardando cambios en BD...</div>`;
    try {
        const resp = await fetch(API.adminEditarCancha(canchaEditandoId), {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ nombre, tipo, precio_por_hora, estado, descripcion, imagen_url })
        });
        let data;
        try { data = await resp.json(); } catch { throw new Error(`HTTP ${resp.status} - Sin JSON`); }
        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || 'Error al guardar'}</div>`;
            return;
        }
        msgEl.innerHTML = `<div class="alert alert-success">✅ ${data.msg} Actualizando lista...</div>`;
        setTimeout(() => {
            cerrarModalEditarCancha();
            cargarCanchasAdmin();
        }, 700);
    } catch (e) {
        console.error(e);
        const isFetch = e.message.includes("Failed to fetch");
        const detalle = isFetch ? `Failed to fetch: backend no responde en ${API_BASE_URL}. Ejecuta <code>python app.py</code>` : e.message;
        msgEl.innerHTML = `<div class="alert alert-error">❌ ${detalle}</div>`;
    }
}

// Cerrar modal al click fuera
document.addEventListener("click", (e) => {
    const overlay = document.getElementById("modal-cancha");
    if (overlay && e.target === overlay) cerrarModalCancha();
    const overlay2 = document.getElementById("modal-editar-cancha");
    if (overlay2 && e.target === overlay2) cerrarModalEditarCancha();
});

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tbody-canchas")) {
        cargarPanelAdmin();
    }
});
