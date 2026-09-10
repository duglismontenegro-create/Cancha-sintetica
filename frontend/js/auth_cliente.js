/**
 * auth_cliente.js - Lógica de Registro y Login para CLIENTES
 * Conectado a: POST /api/clientes/registro  y  POST /api/clientes/login
 * Usa fetch() y guarda token en localStorage
 */

// Registro Cliente
async function registrarCliente(event) {
    event.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("password").value;

    const msgEl = document.getElementById("msg");

    try {
        // 👉 PUNTO DE CONEXIÓN BACKEND - Cambia API.registroCliente en config.js si tu URL cambia
        const resp = await fetch(API.registroCliente, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, telefono, password })
        });

        const data = await resp.json();

        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || "Error en registro"}</div>`;
            return;
        }

        // Guarda token y usuario
        Token.set(data.token, data.usuario);
        msgEl.innerHTML = `<div class="alert alert-success">¡Registro exitoso! Redirigiendo...</div>`;
        setTimeout(() => window.location.href = "index.html", 1000);

    } catch (err) {
        console.error(err);
        msgEl.innerHTML = `<div class="alert alert-error">Error de red. ¿Está corriendo el backend en ${API_BASE_URL}?</div>`;
    }
}

// Login Cliente
async function loginCliente(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msgEl = document.getElementById("msg");

    try {
        // 👉 PUNTO DE CONEXIÓN BACKEND
        const resp = await fetch(API.loginCliente, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await resp.json();

        if (!resp.ok || !data.ok) {
            msgEl.innerHTML = `<div class="alert alert-error">${data.msg || "Credenciales inválidas"}</div>`;
            return;
        }

        Token.set(data.token, data.usuario);
        msgEl.innerHTML = `<div class="alert alert-success">¡Bienvenido ${data.usuario.nombre}!</div>`;
        setTimeout(() => window.location.href = "index.html", 800);

    } catch (err) {
        console.error(err);
        msgEl.innerHTML = `<div class="alert alert-error">Error de red. Verifica que Flask esté en ${API_BASE_URL}</div>`;
    }
}

// Logout (reutilizable en cualquier página)
function logout() {
    Token.clear();
    window.location.href = "index.html";
}

// Auto-redirige si ya está logueado (opcional)
// Descomenta si quieres que un cliente logueado no vea de nuevo el login
// if (Token.isLogged() && Token.getUsuario()?.rol === "cliente") { window.location.href = "index.html"; }
