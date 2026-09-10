/**
 * auth_admin.js - Login EXCLUSIVO para ADMINISTRADORES
 * Conectado a: POST /api/admin/login  (tabla 'administradores')
 * 
 * SEGURIDAD: Este login NUNCA usa la tabla 'clientes'.
 * Si un cliente intenta loguearse aquí, el backend responde 401.
 */

async function loginAdmin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msgEl = document.getElementById("msg");

    try {
        // 👉 PUNTO DE CONEXIÓN BACKEND - SOLO ADMIN
        const resp = await fetch(API.loginAdmin, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await resp.json();

        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || "Credenciales de administrador inválidas"}</div>`;
            return;
        }

        // Verifica que el rol sea administrador (doble seguridad frontend)
        if (data.usuario.rol !== "administrador") {
            msgEl.innerHTML = `<div class="alert alert-error">Acceso denegado: rol no autorizado</div>`;
            return;
        }

        Token.set(data.token, data.usuario);
        msgEl.innerHTML = `<div class="alert alert-success">Acceso admin concedido. Redirigiendo al panel...</div>`;
        setTimeout(() => window.location.href = "panel_admin.html", 800);

    } catch (err) {
        console.error(err);
        msgEl.innerHTML = `<div class="alert alert-error">Error de red. ¿Flask corriendo en ${API_BASE_URL}?</div>`;
    }
}

function logoutAdmin() {
    Token.clear();
    window.location.href = "login_admin.html";
}

// Protección de panel: si no es admin, expulsar
function protegerPanelAdmin() {
    const usuario = Token.getUsuario();
    const token = Token.get();
    if (!token || !usuario || usuario.rol !== "administrador") {
        alert("Acceso denegado. Debes iniciar sesión como Administrador. Ningún cliente puede acceder al panel.");
        window.location.href = "login_admin.html";
    }
}
