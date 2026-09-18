# ⚽ CANCHAS SINTÉTICAS — Sistema de Reservas / Booking System

```
  ██████╗  █████╗ ███╗   ██╗ ██████╗██╗  ██╗ █████╗ ███████╗   ███████╗██╗███╗   ██╗████████╗███████╗████████╗██╗ ██████╗ █████╗ ███████╗
 ██╔════╝ ██╔══██╗████╗  ██║██╔════╝██║  ██║██╔══██╗██╔════╝   ██╔════╝██║████╗  ██║╚══██╔══╝██╔════╝╚══██╔══╝██║██╔════╝██╔══██╗██╔════╝
 ██║      ███████║██╔██╗ ██║██║     ███████║███████║███████╗   ███████╗██║██╔██╗ ██║   ██║   █████╗     ██║   ██║██║     ███████║█████╗
 ██║      ██╔══██║██║╚██╗██║██║     ██╔══██║██╔══██║╚════██║   ╚════██║██║██║╚██╗██║   ██║   ██╔══╝     ██║   ██║██║     ██╔══██║██╔══╝
 ╚██████╗ ██║  ██║██║ ╚████║╚██████╗██║  ██║██║  ██║███████║   ███████║██║██║ ╚████║   ██║   ███████╗   ██║   ██║╚██████╗██║  ██║███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝   ╚═╝   ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
```

> 🇪🇸 **Reserva 24/7 de canchas sintéticas** con roles separados (Cliente vs Administrador), precios por hora en vivo, anti-solapamiento de horarios, JWT seguro y panel admin completo.
> 🇺🇸 **Synthetic-court 24/7 booking** with separated roles (Client vs Admin), live hourly pricing, schedule anti-overlap, secure JWT and full admin panel.
>
> 🇪🇸 Stack: `Python Flask` + `MySQL/MariaDB` + `JWT` + `Werkzeug Security` + `HTML/CSS/JS (fetch)`
> 🇺🇸 Stack: `Python Flask` + `MySQL/MariaDB` + `JWT` + `Werkzeug Security` + `HTML/CSS/JS (fetch)`
> Repo: `https://github.com/duglismontenegro-create/Cancha-sintetica` — Rama `main`

---

## 🚀 Inicio rápido 1-clic — `iniciar.bat` / One-click start

Ya **no necesitas abrir terminales manualmente**. En la **raíz del proyecto** (`Cancha-sintetica/`), doble clic:

```
iniciar.bat
```

Ese script hace **todo automáticamente** / *that script does everything automatically*:

| Paso / Step | Qué hace / What it does | Puerto / Port |
|---|---|---|
| 1 | Verifica que exista `backend\venv` | — |
| 2 | Copia `backend\.env.example` → `backend\.env` si no existe | — |
| 3 | Arranca el **backend Flask** en su propia ventana | `http://127.0.0.1:5000` |
| 4 | Levanta el **frontend** estático (`http.server` 5500) | `http://127.0.0.1:5500` |
| 5 | Abre el navegador automáticamente en `index.html` | — |

**Para detener / to stop:** cierra las 2 ventanas (`Backend API` y `Frontend`) o `Ctrl+C` en cada una — se liberan los puertos 5000 y 5500.

> ⚠️ **Requisito / Requirement:** `backend\venv` creado + MySQL/MariaDB corriendo en `3306` con la BD cargada (ver [crear la BD](#-crear-la-base-de-datoscrear-la-database)).

---

## 📑 Índice / Table of contents

1. [✨ Características / Features](#-características--features)
2. [📁 Estructura / Structure](#-estructura--structure)
3. [🧰 Requisitos previos / Prerequisites](#-requisitos-previos--prerequisites)
4. [🚀 Instalación paso a paso / Step-by-step install](#-instalación-paso-a-paso--step-by-step-install)
5. [🗄️ Crear la base de datos / Create the database](#-crear-la-base-de-datos--create-the-database)
6. [🔑 Credenciales de prueba / Test credentials](#-credenciales-de-prueba--test-credentials)
7. [🔌 Endpoints completos / Full endpoint map](#-endpoints-completos--full-endpoint-map)
8. [📌 Estados de las reservas / Reservation states](#-estados-de-las-reservas--reservation-states)
9. [🖼️ Estados de las canchas / Court states](#-estados-de-las-canchas--court-states)
10. [📅 Flujo de reserva y roles / Booking flow & roles](#-flujo-de-reserva-y-roles--booking-flow--roles)
11. [🔒 Seguridad / Security](#-seguridad--security)
12. [🧪 Verificación rápida / Quick verification](#-verificación-rápida--quick-verification)
13. [🔧 Solución de problemas / Troubleshooting](#-solución-de-problemas--troubleshooting)

---

## ✨ Características / Features

- 🇪🇸 **Catálogo visual** con tarjetas de cancha (estado `Disponible/Mantenimiento`), filtros `Todas / Disponibles / Mantenimiento / Fútbol 5-7-8-11` y **precio por hora** visible en cada card (`$80.000 – $250.000 COP`).
- 🇺🇸 **Visual catalog** of court cards (state `Disponible/Mantenimiento`), filters and per-hour price on every card.
- 🇪🇸 **Banner de tarifas oficiales** en `index.html` con ejemplos `80.000 × 1.5 = 120.000`.
- 🇪🇸 **Reserva obligatoria con login cliente** — modal pide `fecha / hora_inicio / duración (0.5–4h)` y muestra **costo estimado en vivo** `precio × duración`.
- 🇪🇸 **Post-reserva detallada:** resumen desglosado, instrucciones de pago, tiempo límite de llegada **15 min antes**.
- 🇪🇸 **Mis Reservas (cliente):** `Confirmar` (bloquea para siempre) y `Cancelar y Borrar` (borra fila y libera horario).
- 🇪🇸 **Panel admin exclusivo:** gestiona/cancha/precios/fotos/estados y ve todas las reservas.
- 🇺🇸 **Client-only JWT** + **Admin-only JWT**, 403 for wrong role.

---

## 📁 Estructura / Structure

```
Cancha-sintetica/
├── iniciar.bat               # 🚀 PORTADA DE INICIO — levanta backend + frontend con 1 clic
├── README.md                 # Este documento / this file
├── backend/
│   ├── app.py                # Flask API — TODOS los endpoints (app.py)
│   ├── auth.py               # JWT: generar_token, token_requerido, solo_cliente, solo_admin
│   ├── config.py             # Config desde ENV / .env
│   ├── database.py           # get_db_connection(), get_cursor_dict(), ensure_db_compatible()
│   ├── requirements.txt      # Flask 3.0.3, Flask-Cors 4.0.1, mysql-connector 9.1.0, PyJWT 2.9, Werkzeug 3.0.4
│   ├── .env.example          # Plantilla
│   ├── .env                  # tus credenciales reales (NO subir a GitHub)
│   └── venv/                 # entorno virtual
├── frontend/
│   ├── index.html            # Catálogo + banner tarifas + modal reserva + modal mis reservas
│   ├── registro_cliente.html # Registro de clientes
│   ├── login_cliente.html    # Login clientes
│   ├── login_admin.html      # Login EXCLUSIVO administradores
│   ├── panel_admin.html      # Gestión canchas (precios/fotos) + reservas
│   ├── css/style.css         # Paleta verde/blanco/negro
│   └── js/
│       ├── config.js         # 👉 API_BASE_URL — único lugar para cambiar dominio del backend
│       ├── auth_cliente.js   # POST /api/clientes/registro y /login
│       ├── auth_admin.js     # POST /api/admin/login + protegerPanelAdmin()
│       ├── canchas.js        # GET /api/canchas, filtros, verMisReservas() + Confirmar/Borrar
│       ├── reserva.js        # POST /api/reservas + mostrarResumenReserva()
│       └── admin.js          # GET/POST/PUT /api/admin/* + editar cancha
├── database/
│   └── schema.sql            # Crea BD reservas_cancha, 5 tablas, datos de prueba
└── docs/                     # (opcional) capturas, diagramas
```

---

## 🧰 Requisitos previos / Prerequisites

- **Python 3.10+** (`python --version`)
- **MySQL 8.0+ o MariaDB 10.4+** (XAMPP recomendado) — usuario `root`
- **Node opcional** — solo si usas `npx serve` para el frontend
- **VS Code + Live Server** (recomendado) o cualquier servidor estático

---

## 🚀 Instalación paso a paso / Step-by-step install

### 1) Clonar / Clone
```bash
git clone https://github.com/duglismontenegro-create/Cancha-sintetica.git
cd Cancha-sintetica
```

### 2) Entorno virtual y dependencias / venv & deps

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate.bat
pip install -r requirements.txt
```
**Linux / Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3) Variables de entorno / Environment
```bash
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
```
Edita `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL   # vacío si root no tiene pass
DB_NAME=reservas_cancha
SECRET_KEY=cambia_esta_clave_super_larga_y_segura_123!
JWT_EXPIRATION_HOURS=24
PAYMENT_INSTRUCTIONS=Realiza el pago por Nequi/Bancolombia al 300-123-4567 o en recepción. Envía comprobante al WhatsApp.
```

---

## 🗄️ Crear la base de datos / Create the database

**Opción A — MySQL Workbench:** `File > Open SQL Script...` → `database/schema.sql` → Ejecutar ⚡

**Opción B — CLI:**
```bash
mysql -u root -p < database/schema.sql
# MariaDB/XAMPP sin password:
C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
```

**Qué crea / What it creates (`database/schema.sql:7`):**
- BD `reservas_cancha` (`utf8mb4`)
- Tablas: `administradores`, `clientes`, `canchas`, `reservas`, `mantenimiento`
- Datos de prueba: 2 admins, 4 clientes, 5 canchas, 3 reservas

> El backend auto-ejecuta `ensure_db_compatible()` (`backend/database.py:29`) al iniciar para migrar columnas faltantes.

---

## 🔑 Credenciales de prueba / Test credentials

**Clientes — login `frontend/login_cliente.html` → `POST /api/clientes/login` — pass todas `123456`:**

| Nombre / Name | Email | Pass |
|---|---|---|
| Carlos Pérez | `carlos@email.com` | `123456` |
| Ana Gómez | `ana@email.com` | `123456` |
| Sofía Martínez | `sofia@email.com` | `123456` |
| Mateo Rodríguez | `mateo@email.com` | `123456` |

**Administradores — `POST /api/admin/login` — pass `Admin123*`:**

| Nombre / Name | Email | Pass |
|---|---|---|
| Laura Jiménez | `laura.admin@reservas.com` | `Admin123*` |
| Andrés Parra | `andres.admin@reservas.com` | `Admin123*` |

> ⚠️ El admin **no tiene registro público**; un cliente jamás accede a `panel_admin.html` (403 backend + `protegerPanelAdmin()` frontend).

---

## 🔌 Endpoints completos / Full endpoint map

Todos en `backend/app.py` (línea del `@app.route` → función).

| # | Método / Method | Ruta / Route | Handler | Protección / Guard |
|---|---|---|---|---|
| 1 | GET | `/` | `home()` | Público |
| 2 | POST | `/api/clientes/registro` | `registro_cliente()` | Público |
| 3 | POST | `/api/clientes/login` | `login_cliente()` | Público |
| 4 | POST | `/api/admin/login` | `login_admin()` | Público (solo tabla `administradores`) |
| 5 | GET | `/api/canchas` | `listar_canchas()` | Público |
| 6 | GET | `/api/canchas/<id>` | `detalle_cancha()` | Público |
| 7 | POST | `/api/reservas` | `crear_reserva()` | `@solo_cliente` |
| 8 | GET | `/api/reservas/mis-reservas` | `mis_reservas()` | `@solo_cliente` |
| 9 | PUT | `/api/reservas/<id>/estado` | `cliente_cambiar_estado_reserva()` | `@solo_cliente` (Confirma y bloquea) |
| 10 | DELETE | `/api/reservas/<id>` | `cliente_eliminar_reserva()` | `@solo_cliente` (borra fila, libera horario) |
| 11 | GET | `/api/admin/canchas` | `admin_listar_canchas()` | `@solo_admin` |
| 12 | POST | `/api/admin/canchas` | `admin_crear_cancha()` | `@solo_admin` |
| 13 | PUT | `/api/admin/canchas/<id>` | `admin_editar_cancha()` | `@solo_admin` |
| 14 | PUT | `/api/admin/canchas/<id>/estado` | `admin_cambiar_estado()` | `@solo_admin` |
| 15 | GET | `/api/admin/reservas` | `admin_listar_reservas()` | `@solo_admin` |
| 16 | PUT | `/api/admin/reservas/<id>/estado` | `admin_cambiar_estado_reserva()` | `@solo_admin` |

**Helpers de autenticación (`backend/auth.py`):** `generar_token()` `auth.py:12`, `token_requerido` `auth.py:34`, `solo_cliente` `auth.py:50`, `solo_admin` `auth.py:60`.

---

## 📌 Estados de las reservas / Reservation states

| Estado / State | Quién lo setea / Set by | Comportamiento / Behavior |
|---|---|---|
| 🟡 **Pendiente** | Al crear la reserva | Reserva creada pero **no bloqueada**: puede modificarse/cancelarse |
| 🟢 **Confirmada** | Cliente (`PUT /estado`) o admin | **BLOQUEADA por diseño**: ya NO se puede cancelar, borrar ni editar. El horario queda reservado |
| 🔴 **Cancelada / Borrada** | Cliente (`DELETE`) o admin | **Se BORRA la fila de BD** (`DELETE FROM reservas`): libera el horario y ya no cuenta para solapamiento |

### 🔁 Transiciones / Transitions
```
            PUT estado
Pendiente ─────────────► Confirmada   (cliente confirma → bloquea 🔒)
    ▲                          │
    │                          ▼
    └──────────────── Diseño: DELETE /api/reservas/<id> (borra fila + libera slot)
                         Solo Pendiente/Cancelada se borran; Confirmada → 400
```

**Reglas de oro / Golden rules:**
1. `Confirmada` = **bloqueada** (400 si intentas borrar/cambiar).
2. `Cancelada` / borrada = **libera horario**.
3. Anti-solapamiento `hay_solapamiento_reserva()` excluye `Cancelada` y borradas.

---

## 🖼️ Estados de las canchas / Court states

| Estado / State | Efecto / Effect |
|---|---|
| `Disponible` | Visible en catálogo, se puede reservar |
| `Mantenimiento` | Visible pero **NO se puede reservar** (botón deshabilitado + API 400) |

---

## 📅 Flujo de reserva y roles / Booking flow & roles

1. Cliente entra a `index.html` → ve cards con **precio/hora** (`GET /api/canchas`).
2. Clic `Reservar` → verifica login cliente (`Token.isLogged()` + `rol === 'cliente'`); si no redirige a `login_cliente.html`.
3. Elige `fecha`, `hora_inicio`, `duración` → **costo en vivo** `precio × duración`.
4. `POST /api/reservas` con `Authorization: Bearer <token>` → backend valida: cancha Disponible, fecha futura, **no solapamiento** (`hay_solapamiento_reserva()`), calcula `hora_fin` y `costo_total`.
5. Modal post-reserva → resumen detallado + instrucciones de pago + llegada 15 min antes.
6. `Mis Reservas` → `GET /api/reservas/mis-reservas` → **Confirmar** (bloquea) / **Cancelar y Borrar** (DELETE libera horario).
7. Admin en `panel_admin.html` → gestiona canchas (precios/fotos) y reservas.

---

## 🔒 Seguridad / Security

| Capa / Layer | Detalle / Detail |
|---|---|
| 🔑 **Roles separados** | Tablas `clientes` y `administradores` independientes; login admin consulta SOLO `administradores` |
| 🔐 **Passwords** | Hashing con Werkzeug **`generate_password_hash`** (scrypt), nunca en texto plano |
| 🪙 **JWT** | PyJWT con payload `rol` (`cliente\|administrador`) + `exp` (24h) + `SECRET_KEY` |
| 🛡️ **Decorators** | `@solo_cliente` `auth.py:50` y `@solo_admin` `auth.py:60` → devuelven 403 si el rol no coincide |
| 🚫 **Ownership** | El cliente solo lee/cancela SU reserva (`cliente_id` del JWT); ajenas → 403 |
| ⏰ **Anti-solapamiento** | `hay_solapamiento_reserva()` → `409` si el horario colisiona; excluye `Cancelada`/borradas |
| ⚙️ **CORS** | CORS habilitado en `/api/*` desde `http://...`, no `file://` |

---

## 🧪 Verificación rápida / Quick verification

```bash
# Health
curl http://127.0.0.1:5000/

# Listar canchas
curl http://127.0.0.1:5000/api/canchas

# Login cliente
curl -X POST http://127.0.0.1:5000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"carlos@email.com\",\"password\":\"123456\"}"

# Chequear sintaxis (local)
python -m py_compile backend/app.py && echo OK
node --check frontend/js/canchas.js && echo OK
```

---

## 🔧 Solución de problemas / Troubleshooting

| Error | Causa / Cause | Solución / Fix |
|---|---|---|
| `Failed to fetch` / `NetworkError` | Backend apagado o `file://` | Ejecuta `iniciar.bat`; abre con `http://` (Live Server), NO con doble clic |
| `Token no proporcionado` 401 | No hay JWT | Inicia sesión como cliente antes de reservar |
| `Acceso denegado. Solo Administradores` 403 | Token cliente en `/api/admin/*` | Usa `login_admin.html` (`Admin123*`) |
| `Error de conexión a BD` 500 | MySQL apagado o `.env` mal | Verifica `DB_PASSWORD`, `SHOW DATABASES;`, panel XAMPP |
| `Horario no disponible` 409 | Solape con otra reserva | Elige otra `hora_inicio`/`fecha`; `Cancelada`/borrada libera el slot |
| `Reserva Confirmada: ya está bloqueada` 400 | Intentas borrar una Confirmada | Es correcto — Confirmada queda bloqueada por diseño |

---

## 🚢 Notas de producción / Production notes

- Cambia `SECRET_KEY` en `.env`, uso de `HTTPS`, `gunicorn`, y guarda `.env` fuera del repo (añade `backend/.env` a `.gitignore`).
- El `iniciar.bat` es la forma recomendada para desarrollo local: 1 clic levanta backend + frontend.

---

**🇪🇸 ⚽ ¡Listo para jugar, reservar y administrar! 🏆**
**🇺🇸 ⚽ Ready to play, book and manage! 🏆**
