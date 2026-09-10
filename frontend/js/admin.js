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
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;
    try {
        const resp = await fetch(API.adminCanchas, { headers: authHeaders() });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">${data.msg}</td></tr>`;
            return;
        }
        tbody.innerHTML = data.canchas.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><b>${c.nombre}</b><br><small>${c.tipo}</small></td>
                <td>$${Number(c.precio_por_hora).toLocaleString('es-CO')}</td>
                <td><span class="badge ${c.estado==='Disponible'?'badge-disponible':'badge-mantenimiento'}">${c.estado}</span></td>
                <td>
                    <select class="estado-select" onchange="cambiarEstadoCancha(${c.id}, this.value)">
                        <option value="Disponible" ${c.estado==='Disponible'?'selected':''}>Disponible</option>
                        <option value="Mantenimiento" ${c.estado==='Mantenimiento'?'selected':''}>Mantenimiento</option>
                    </select>
                </td>
            </tr>
        `).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${e.message}</td></tr>`;
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
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${data.msg}</td></tr>`;
            return;
        }
        if (data.reservas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay reservas aún.</td></tr>`;
            return;
        }
        tbody.innerHTML = data.reservas.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${r.cancha_nombre}<br><small>${r.cancha_tipo}</small></td>
                <td>${r.cliente_nombre}<br><small>${r.cliente_email}</small></td>
                <td>${r.fecha}<br><small>${r.hora_inicio} - ${r.hora_fin} (${r.duracion_horas}h)</small></td>
                <td>$${Number(r.costo_total).toLocaleString('es-CO')}</td>
                <td><span class="badge ${r.estado==='Confirmada'?'badge-disponible':'badge-mantenimiento'}">${r.estado}</span></td>
            </tr>
        `).join("");
        document.getElementById("count-reservas").textContent = `${data.reservas.length} reservas`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error: ${e.message}</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tbody-canchas")) {
        cargarPanelAdmin();
    }
});
