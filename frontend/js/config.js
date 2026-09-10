/**
 * config.js - CONFIGURACIÓN CENTRAL DEL FRONTEND
 * 
 * 👉 AQUÍ ES DONDE DEBES APUNTAR TUS URLs HACIA TU BACKEND PYTHON
 * 
 * Si tu Flask corre en localhost:5000, deja como está.
 * Si lo despliegas (ej: https://api.midominio.com), cambia API_BASE_URL.
 */

const API_BASE_URL = "http://127.0.0.1:5000"; // <--- CAMBIA ESTA LÍNEA SEGÚN TU DEPLOY

// Rutas de la API (no necesitas cambiarlas si no cambias app.py)
const API = {
    // Clientes
    registroCliente: `${API_BASE_URL}/api/clientes/registro`,
    loginCliente: `${API_BASE_URL}/api/clientes/login`,
    // Admin exclusivo
    loginAdmin: `${API_BASE_URL}/api/admin/login`,
    // Canchas
    canchas: `${API_BASE_URL}/api/canchas`,
    canchaDetalle: (id) => `${API_BASE_URL}/api/canchas/${id}`,
    // Reservas (requiere token)
    reservas: `${API_BASE_URL}/api/reservas`,
    misReservas: `${API_BASE_URL}/api/reservas/mis-reservas`,
    // Admin panel
    adminCanchas: `${API_BASE_URL}/api/admin/canchas`,
    adminCambiarEstadoCancha: (id) => `${API_BASE_URL}/api/admin/canchas/${id}/estado`,
    adminReservas: `${API_BASE_URL}/api/admin/reservas`,
};

// Helpers de token
const Token = {
    set: (token, usuario) => {
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuario));
    },
    get: () => localStorage.getItem("token"),
    getUsuario: () => {
        try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; }
    },
    clear: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
    },
    isLogged: () => !!localStorage.getItem("token")
};

// Helper para headers con Authorization
function authHeaders() {
    const token = Token.get();
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}
