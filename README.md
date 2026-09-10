# ⚽ Sistema de Reservas - Canchas Sintéticas

Stack: **Frontend HTML/CSS/JS (fetch)** + **Backend Python Flask** + **MySQL**

Cumple 100% los requerimientos de negocio y seguridad solicitados.

---

## 📁 Estructura limpia y separada

```
CANCHAS SINTETICAS/
├── backend/
│   ├── app.py              # Flask API (rutas clientes/admin/canchas/reservas)
│   ├── config.py           # Config y variables de entorno
│   ├── database.py         # Conexión MySQL
│   ├── auth.py             # JWT + decorators solo_cliente / solo_admin
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html          # Catálogo visual (Disponible/Mantenimiento)
│   ├── registro_cliente.html
│   ├── login_cliente.html
│   ├── login_admin.html    # Exclusivo tabla administradores
│   ├── panel_admin.html    # Solo admin, bloquea clientes
│   ├── css/style.css
│   └── js/
│       ├── config.js       # 👉 AQUÍ apuntas API_BASE_URL a tu backend
│       ├── auth_cliente.js # fetch a /api/clientes/*
│       ├── auth_admin.js   # fetch a /api/admin/login
│       ├── canchas.js      # fetch a /api/canchas + filtros
│       ├── reserva.js      # POST /api/reservas + modal post-reserva
│       └── admin.js        # Panel admin fetches
└── database/
    └── schema.sql          # Tablas clientes, administradores, canchas, reservas + datos prueba
```

---

## 🚀 Instalación Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # y edita DB_PASSWORD y SECRET_KEY
```

### Crea la BD MySQL
```sql
-- En MySQL Workbench o CLI:
SOURCE ../database/schema.sql

-- Genera hash para admin (si el demo no loguea):
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin123*'))"
-- Luego:
UPDATE canchas_db.administradores SET password_hash='TU_HASH' WHERE email='admin@canchas.com';
```

### Corre Flask
```bash
python app.py
# API en http://127.0.0.1:5000
```

---

## 🌐 Frontend - Configuración API

**Solo 1 línea para cambiar:**

`frontend/js/config.js:7`
```js
const API_BASE_URL = "http://127.0.0.1:5000"; // <-- cámbiala a tu dominio en producción
// Ej: "https://api.tudominio.com"
```

Luego abre el frontend:
- Opción 1: Doble click en `frontend/index.html`
- Opción 2 (recomendada): Live Server de VSCode o `npx serve frontend`

---

## 🔒 Seguridad - Roles obligatorios

| Rol | Registro | Login | Tabla | Acceso Admin |
|-----|----------|-------|-------|--------------|
| Cliente | `registro_cliente.html` → POST /api/clientes/registro | `login_cliente.html` → POST /api/clientes/login | `clientes` | **BLOQUEADO (403)** |
| Administrador | **No tiene registro público** (INSERT manual en BD) | `login_admin.html` → POST /api/admin/login | `administradores` | Permitido |

- **Obligatorio iniciar sesión para reservar**: `js/reserva.js:15` verifica `Token.isLogged()` y `rol === cliente`, si no redirige a login.
- Tokens JWT llevan `rol` en payload, backend valida con decoradores `solo_cliente` y `solo_admin`.
- Un token de cliente jamás accede a `/api/admin/*`.

---

## 🏟️ Vista Canchas y Disponibilidad

- `GET /api/canchas` retorna todas con `estado: Disponible | Mantenimiento`
- Frontend `canchas.js` renderiza cards con badge verde/amarillo y botón:
  - Disponible → `Reservar ahora` (abre modal)
  - Mantenimiento → `No disponible` (deshabilitado)
- Filtros: Todas, Disponibles, Mantenimiento, Fútbol 5/7/8/11

---

## 📅 Flujo de Reserva

1. Cliente logueado hace click en `Reservar ahora`
2. Modal pide: `fecha`, `hora_inicio`, `duración`
3. `POST /api/reservas` con `Authorization: Bearer <token>`
   - Valida cancha Disponible, fecha futura, no solapamiento, calcula `hora_fin` y `costo_total`
4. **Ventana post-reserva detallada** (`reserva.js:mostrarResumenReserva`):
   - ✅ Resumen tiempo solicitado y costo estimado
   - 💳 Instrucciones de pago (de `Config.PAYMENT_INSTRUCTIONS`)
   - ⏰ Tiempo límite llegada: 15 min antes (calculado)

---

## 🔧 URLs Backend para apuntar en fetch

Todos los fetch están comentados con `👉 PUNTO DE CONEXIÓN BACKEND`:

- `js/config.js` centraliza todas las rutas
- `js/auth_cliente.js` → `API.registroCliente`, `API.loginCliente`
- `js/auth_admin.js` → `API.loginAdmin`
- `js/canchas.js` → `API.canchas`
- `js/reserva.js` → `API.reservas` (con `authHeaders()`)
- `js/admin.js` → `API.adminCanchas`, `API.adminCambiarEstadoCancha`, `API.adminReservas`

Si cambias prefijo `/api` en Flask, solo cambia `config.js`.

---

## 🧪 Test rápido

```bash
# Health check
curl http://127.0.0.1:5000/

# Registro cliente
curl -X POST http://127.0.0.1:5000/api/clientes/registro -H "Content-Type: application/json" -d "{\"nombre\":\"Test\",\"email\":\"test@test.com\",\"password\":\"123456\"}"

# Login cliente -> guarda token
curl -X POST http://127.0.0.1:5000/api/clientes/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"

# Listar canchas
curl http://127.0.0.1:5000/api/canchas
```

---

## 📌 Notas

- Precios y tipos editables en tabla `canchas`.
- Para añadir Fútbol 9, solo inserta nuevo `tipo` y el filtro frontend lo tomará automático si añades botón.
- Producción: cambia `SECRET_KEY`, usa HTTPS, y considera `Flask-JWT-Extended` + refresh tokens.
