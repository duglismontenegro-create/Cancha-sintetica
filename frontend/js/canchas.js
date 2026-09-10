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
        const btn = disponible
            ? `<button class="btn btn-primary" onclick="abrirModalReserva(${c.id}, '${c.nombre.replace(/'/g, "\\'")}', '${c.tipo}', ${c.precio_por_hora})">Reservar ahora</button>`
            : `<button class="btn btn-disabled" disabled>No disponible</button>`;

        return `
        <div class="card">
            <img src="${c.imagen_url || 'https://via.placeholder.com/400x250?text=Cancha'}" alt="${c.nombre}" onerror="this.src='https://via.placeholder.com/400x250?text=Cancha'">
            <div class="card-body">
                <div class="card-title">${c.nombre}</div>
                <div class="card-tipo">${c.tipo} • ${c.estado}</div>
                <div class="badges"><span class="badge ${badgeClass}">${badgeText}</span></div>
                <div class="precio">$${Number(c.precio_por_hora).toLocaleString('es-CO')} / hora</div>
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
    try {
        const resp = await fetch(API.misReservas, { headers: authHeaders() });
        const data = await resp.json();
        if (!data.ok) { alert(data.msg); return; }
        if (data.reservas.length === 0) { alert("Aún no tienes reservas."); return; }
        let txt = "TUS RESERVAS:\n\n" + data.reservas.map(r =>
            `• ${r.cancha_nombre} (${r.tipo}) - ${r.fecha} ${r.hora_inicio} a ${r.hora_fin} - $${Number(r.costo_total).toLocaleString('es-CO')} - ${r.estado}`
        ).join("\n");
        alert(txt);
    } catch (e) {
        alert("Error al cargar reservas: " + e.message);
    }
}

// Inicialización automática si existe grid-canchas
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("grid-canchas")) {
        cargarCanchas();
    }
    actualizarNavbar();
});
