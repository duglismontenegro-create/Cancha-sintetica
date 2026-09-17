# ⚽ Sistema de Reservas — Canchas Sintéticas

**Stack:** `Frontend HTML / CSS / JS (fetch)` + `Backend Python Flask` + `MySQL` + `JWT (PyJWT)` + `Werkzeug Security`

Reserva 24/7 con roles separados, precios visibles, solapamiento controlado y panel admin completo. Diseño **verde / blanco / negro** estilo fútbol.

> Repo: `https://github.com/duglismontenegro-create/Cancha-sintetica` — Rama `main`

---

## 📑 Índice
1. [Características](#-características)
2. [Estructura](#-estructura-del-proyecto)
3. [Requisitos previos](#-requisitos-previos)
4. [Instalación paso a paso — Backend](#-instalación-paso-a-paso--backend)
5. [Crear la base de datos](#-crear-la-base-de-datos)
6. [Configurar y ejecutar el frontend](#-configurar-y-ejecutar-el-frontend)
7. [Credenciales de prueba](#-credenciales-de-prueba)
8. [Endpoints y ubicación exacta](#-endpoints--ubicación-exacta-archivolinea)
9. [Flujo de reserva y roles](#-flujo-de-reserva-y-roles)
10. [Verificación rápida](#-verificación-rápida)
11. [Solución de problemas](#-solución-de-problemas)
12. [Notas de producción](#-notas-de-producción)

---

## ✨ Características

- **Catálogo visual** con estado `Disponible / Mantenimiento`, filtros `Todas / Disponibles / Mantenimiento / Fútbol 5-7-8-11` y **precio por hora** en cada card (`$80.000 - $250.000 COP`).
- **Banner de tarifas oficiales** en `index.html` con ejemplos `80.000×1.5 = 120.000`.
- **Reserva obligatoria con login cliente** — modal pide `fecha / hora_inicio / duración (0.5-4h)` y muestra **costo estimado en vivo** `precio×duración`.
- **Post-reserva detallada:** resumen, instrucciones de pago (`Config.PAYMENT_INSTRUCTIONS`), tiempo límite llegada `15 min antes`.
- **Mis Reservas (cliente):** botón `Confirmar` → `PUT /api/reservas/<id>/estado` (bloquea la reserva, nadie puede volver a tocarla) y `Cancelar y Borrar` → `DELETE /api/reservas/<id>` (borra fila y libera horario).
- **Panel admin exclusivo:** `panel_admin.html` lista canchas/precios, `PUT /api/admin/canchas/<id>` edita `nombre/tipo/precio/foto/descripción/estado`, `PUT /api/admin/canchas/<id>/estado`, `POST /api/admin/canchas`, y ve todas las reservas.
- **Seguridad:** tablas `clientes` y `administradores` separadas, `password_hash` con `Werkzeug`, JWT con `rol` (`cliente|administrador`), decorators `solo_cliente` `backend/auth.py:50` y `solo_admin` `backend/auth.py:60` (cliente 403 en `/api/admin/*`).
- **Anti-solapamiento:** `hay_solapamiento_reserva()` `backend/app.py:60` bloquea si `start_new < end_exist && end_new > start_exist` y excluye `Cancelada`/borradas.
- **Diseño:** palette fútbol `verde #15803d / blanco / negro #0a0a0a`, fondo degrade, header degrade verde-negro, footer 4 columnas en **todas las páginas**.

---

## 📁 Estructura del proyecto

```
Cancha-sintetica/
├── backend/
│   ├── app.py              # Flask API — TODOS los endpoints (ver tabla abajo)
│   ├── auth.py             # JWT: generar_token, token_requerido, solo_cliente, solo_admin
│   ├── config.py           # Config ENV: DB_HOST/PORT/USER/PASSWORD/NAME, SECRET_KEY, JWT 24h
│   ├── database.py         # get_db_connection(), get_cursor_dict(), ensure_db_compatible() (auto-migración)
│   ├── requirements.txt    # Flask 3.0.3, Flask-Cors 4.0.1, mysql-connector 9.1.0, PyJWT 2.9, Werkzeug 3.0.4
│   ├── .env.example        # plantilla
│   ├── .env                # tus credenciales reales (NO subir a GitHub)
│   └── venv/               # entorno virtual
├── frontend/
│   ├── index.html          # Catálogo + banner tarifas + modal reserva + modal mis reservas
│   ├── registro_cliente.html
│   ├── login_cliente.html
│   ├── login_admin.html
│   ├── panel_admin.html    # Gestión canchas (editar/precio/foto) + reservas
│   ├── css/style.css       # Paleta verde/blanco/negro, hero, cards, footer
│   └── js/
│       ├── config.js       # 👉 API_BASE_URL — único lugar para cambiar dominio del backend
│       ├── auth_cliente.js # POST /api/clientes/registro y /login
│       ├── auth_admin.js   # POST /api/admin/login + protegerPanelAdmin()
│       ├── canchas.js      # GET /api/canchas, filtros, verMisReservas() + Confirmar/Borrar
│       ├── reserva.js      # POST /api/reservas + mostrarResumenReserva()
│       └── admin.js        # GET/POST/PUT /api/admin/* + editar cancha
├── database/
│   └── schema.sql          # DROP/CREATE reservas_cancha, 5 tablas, 5 canchas, 4 clientes, 2 admins, 3 reservas
└── README.md
```

---

## 🧰 Requisitos previos

- **Python 3.10+** (`python --version`)
- **MySQL 8.0+** (Workbench o CLI) + usuario `root` (o el que uses)
- **Node opcional** solo si usas `npx serve` para el frontend
- **VS Code + Live Server** (recomendado) o cualquier servidor estático
- **Git**

---

## 🚀 Instalación paso a paso — Backend

### 1) Clonar

```bash
git clone https://github.com/duglismontenegro-create/Cancha-sintetica.git
cd Cancha-sintetica
```

### 2) Crear entorno virtual e instalar dependencias

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Windows CMD:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
```

**Linux / Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Verifica:
```bash
pip list | grep -i flask
```

### 3) Configurar variables de entorno

```bash
# En backend/
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac
```

Edita `backend/.env` con tu editor (VS Code, notepad):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL   # <- ponla, si no tienes deja vacío pero no recomendado
DB_NAME=reservas_cancha
SECRET_KEY=cambia_esta_clave_super_larga_32_chars!
JWT_EXPIRATION_HOURS=24
PAYMENT_INSTRUCTIONS=Realiza el pago por Nequi/Bancolombia al 300-123-4567 o en recepción. Envía comprobante al WhatsApp.
```

> `backend/config.py:10` carga este `.env` con `load_dotenv()`. `SECRET_KEY` y `JWT_EXPIRATION_HOURS` los usa `backend/auth.py:12`.

---

## 🗄️ Crear la base de datos

### Opción A — MySQL Workbench
1. Abre Workbench → conecta a `Local instance`
2. `File > Open SQL Script...` → selecciona `database/schema.sql`
3. Ejecuta (rayo ⚡)

### Opción B — CLI MySQL

```bash
# Desde la raíz Cancha-sintetica/
mysql -u root -p < database/schema.sql

# O dentro del cliente mysql:
mysql -u root -p
> SOURCE C:/Users/TuRuta/OneDrive/Escritorio/CANCHA/Cancha-sintetica/database/schema.sql
> SHOW TABLES FROM reservas_cancha;
> SELECT id, nombre, tipo, precio_por_hora, estado FROM reservas_cancha.canchas;
```

**Qué crea `database/schema.sql:7`:**
- BD `reservas_cancha` (`utf8mb4`)
- Tablas: `administradores` `schema.sql:12`, `clientes` `schema.sql:23`, `canchas` `schema.sql:33`, `reservas` `schema.sql:45`, `mantenimiento` `schema.sql:62`
- Datos: 2 admins (`Admin123*`), 4 clientes (`123456`), 5 canchas (Fútbol 5 $80k, 7 $120k, 8 $150k, 11 $250k), 3 reservas

### Si el admin no loguea — regenerar hash

```bash
# Activa venv y genera:
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin123*'))"
# Copia el hash y en MySQL:
UPDATE reservas_cancha.administradores SET password_hash='TU_HASH' WHERE email='laura.admin@reservas.com';
```

### 4) Ejecutar Flask

```bash
# Dentro de backend/ con venv activado
python app.py
```

Debe imprimir:
```
============================================================
 API Canchas Sintéticas - Flask
 - Cliente: POST /api/clientes/registro, /api/clientes/login
 - Admin  : POST /api/admin/login  (tabla administradores)
 - Canchas: GET /api/canchas
 - Reserva: POST /api/reservas (requiere Bearer token cliente)
============================================================
 * Running on http://127.0.0.1:5000
```

Prueba health check: abre `http://127.0.0.1:5000/` → JSON `{"ok": true, "msg": "API Canchas Sintéticas activa"}`

> `backend/app.py:34` ejecuta `ensure_db_compatible()` `backend/database.py:29` al iniciar para auto-migrar columnas faltantes si tu BD es antigua.

---

## 🌐 Configurar y ejecutar el Frontend

### 1) Apuntar al backend

Solo 1 línea: `frontend/js/config.js:10`

```js
const API_BASE_URL = "http://127.0.0.1:5000"; // local
// En producción: "https://api.tudominio.com"
```

Todas las rutas usan `API.*` (`frontend/js/config.js:13-30`) y `authHeaders()` `frontend/js/config.js:50`.

### 2) Abrir el frontend (elige 1)

**Recomendado — Live Server (VS Code):**
- Instala extensión `Live Server` → clic derecho en `frontend/index.html` → `Open with Live Server` → `http://127.0.0.1:5500`

**Alternativa — Python http.server:**
```bash
cd frontend
python -m http.server 5500
# abre http://127.0.0.1:5500/index.html
```

**Alternativa — npx serve:**
```bash
npx serve frontend -l 5500
```

> ⚠️ No abras con `file://` (doble clic). CORS `backend/app.py:44` espera `http://...`, si usas `file://` verás `Failed to fetch`.

---

## 🔑 Credenciales de prueba

**Clientes — login `frontend/login_cliente.html:31` → `POST /api/clientes/login` `backend/app.py:170` (pass todos `123456` `database/schema.sql:74`):**

| Nombre | Email | Pass |
|---|---|---|
| Carlos Pérez | `carlos@email.com` | `123456` |
| Ana Gómez | `ana@email.com` | `123456` |
| Sofía Martínez | `sofia@email.com` | `123456` |
| Mateo Rodríguez | `mateo@email.com` | `123456` |

Registro nuevo: `frontend/registro_cliente.html:24` → `POST /api/clientes/registro` `backend/app.py:122`

**Administradores — login `frontend/login_admin.html:31` → `POST /api/admin/login` `backend/app.py:200` (pass `Admin123*` `database/schema.sql:74`):**

| Nombre | Email | Pass |
|---|---|---|
| Laura Jiménez | `laura.admin@reservas.com` | `Admin123*` |
| Andrés Parra | `andres.admin@reservas.com` | `Admin123*` |

> Admin **no tiene registro público** (solo `INSERT` en BD). Un cliente nunca puede entrar a `panel_admin.html` (`frontend/js/auth_admin.js:51` `protegerPanelAdmin()` + `@solo_admin` `backend/auth.py:60` → 403).

---

## 🔌 Endpoints — Ubicación exacta archivo/línea

Todos en `backend/app.py` (verificado con `python` línea por línea):

| # | Método y Ruta | Handler | Línea `@app.route` → `def` | Protección |
|---|---|---|---|---|
| 1 | `GET /` | `home()` | `backend/app.py:107` → `108` | Público |
| 2 | `POST /api/clientes/registro` | `registro_cliente()` | `122` → `123` | Público |
| 3 | `POST /api/clientes/login` | `login_cliente()` | `170` → `171` | Público |
| 4 | `POST /api/admin/login` | `login_admin()` | `200` → `201` | Público (solo `administradores`) |
| 5 | `GET /api/canchas` | `listar_canchas()` | `237` → `238` | Público |
| 6 | `GET /api/canchas/<id>` | `detalle_cancha()` | `267` → `268` | Público |
| 7 | `POST /api/reservas` | `crear_reserva()` | `288` → `290` | `@solo_cliente` `backend/auth.py:50` |
| 8 | `GET /api/reservas/mis-reservas` | `mis_reservas()` | `396` → `398` | `@solo_cliente` |
| 9 | `PUT /api/reservas/<id>/estado` | `cliente_cambiar_estado_reserva()` | `425` → `427` | `@solo_cliente` (confirma y bloquea) |
| 10 | `DELETE /api/reservas/<id>` | `cliente_eliminar_reserva()` | `658` → `660` | `@solo_cliente` (cancela → borra fila) |
| 11 | `GET /api/admin/canchas` | `admin_listar_canchas()` | `499` → `501` | `@solo_admin` `backend/auth.py:60` |
| 12 | `POST /api/admin/canchas` | `admin_crear_cancha()` | `519` → `521` | `@solo_admin` |
| 13 | `PUT /api/admin/canchas/<id>` | `admin_editar_cancha()` | `566` → `568` | `@solo_admin` (edita precio/foto/descr) |
| 14 | `PUT /api/admin/canchas/<id>/estado` | `admin_cambiar_estado()` | `637` → `639` | `@solo_admin` |
| 15 | `GET /api/admin/reservas` | `admin_listar_reservas()` | `690` → `692` | `@solo_admin` |
| 16 | `PUT /api/admin/reservas/<id>/estado` | `admin_cambiar_estado_reserva()` | `718` → `720` | `@solo_admin` |

Helpers:
- `backend/auth.py:12` `generar_token()`, `backend/auth.py:34` `token_requerido`, `backend/auth.py:50` `solo_cliente`, `backend/auth.py:60` `solo_admin`
- `backend/config.py:10` `Config`, `backend/database.py:9` `get_db_connection()`, `backend/database.py:29` `ensure_db_compatible()`

---

## 📅 Flujo de reserva y roles

1. Cliente entra a `index.html` → ve cards con **precio/hora** (`GET /api/canchas` `frontend/js/canchas.js:18`) y banner tarifas.
2. Clic `Reservar ahora — $80.000/h` → `abrirModalReserva()` `frontend/js/reserva.js:13` verifica `Token.isLogged()` y `rol==='cliente'`, si no redirige a `login_cliente.html`.
3. Elige `fecha` (hoy+), `hora_inicio`, `duración` → costo vivo `precio×duración` `frontend/js/reserva.js:53`.
4. `Confirmar Reserva` → `POST /api/reservas` `frontend/js/reserva.js:90` con `Authorization: Bearer <token>` → backend valida cancha `Disponible`, fecha futura, no solape `hay_solapamiento_reserva()` `backend/app.py:60`, calcula `hora_fin` `calcular_hora_fin()` `backend/app.py:52` y `costo_total`.
5. Modal post-reserva `mostrarResumenReserva()` `frontend/js/reserva.js:117`: costo desglosado, instrucciones pago `Config.PAYMENT_INSTRUCTIONS` `backend/config.py:24`, llegada `15min` antes.
6. `Mis reservas` `frontend/js/canchas.js:116` → `GET /api/reservas/mis-reservas` → cards con **Confirmar** (`PUT /estado`) y **Cancelar y Borrar** (`DELETE`). Confirmada se bloquea (ambos botones `disabled`), Cancelada se borra (`DELETE FROM reservas` `backend/app.py:680`) y libera horario.
7. Admin en `panel_admin.html` → `cargarPanelAdmin()` `frontend/js/admin.js:7` → `GET /api/admin/canchas` y `GET /api/admin/reservas`. Botón `✏️ Editar` abre modal `frontend/panel_admin.html:127` → `PUT /api/admin/canchas/<id>` `frontend/js/admin.js:229`.

---

## 🧪 Verificación rápida

```bash
# Health
curl http://127.0.0.1:5000/

# Registro
curl -X POST http://127.0.0.1:5000/api/clientes/registro -H "Content-Type: application/json" -d "{\"nombre\":\"Test\",\"email\":\"test@test.com\",\"password\":\"123456\"}"

# Login cliente
curl -X POST http://127.0.0.1:5000/api/clientes/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"123456\"}"

# Listar canchas
curl http://127.0.0.1:5000/api/canchas

# Chequear sintaxis (local)
python -m py_compile backend/app.py && echo OK
node --check frontend/js/canchas.js && echo OK
```

---

## 🔧 Solución de problemas

| Error | Causa | Solución |
|---|---|---|
| `Failed to fetch` / `NetworkError` | Backend apagado o `file://` | Ejecuta `python backend/app.py` y abre con Live Server (`http://127.0.0.1:5500`) |
| `Token no proporcionado. Debes iniciar sesión` 401 | No hay JWT | Inicia sesión como cliente antes de reservar (`login_cliente.html`) |
| `Acceso denegado. Solo Administradores` 403 | Token cliente en `/api/admin/*` | Usa `login_admin.html` con `laura.admin@reservas.com / Admin123*` |
| `Error de conexión a BD` 500 | MySQL apagado o `.env` mal | Verifica `DB_PASSWORD` en `backend/.env`, `SHOW DATABASES;`, `systemctl status mysql` |
| `Horario no disponible` 409 | Solape | Elige otra `hora_inicio` o `fecha`; `Cancelada`/borrada libera slot |
| `Reserva Confirmada: ya está bloqueada` 400 | Intentas borrar una Confirmada | Es correcto — Confirmada queda bloqueada por diseño |
| `Credenciales inválidas` 401 admin | Hash desactualizado | Regenera hash `generate_password_hash('Admin123*')` y `UPDATE administradores` |

---

## 📌 Notas

- Precios editables: `canchas.precio_por_hora` vía panel admin `PUT /api/admin/canchas/<id>` o directo `UPDATE canchas SET precio_por_hora=...`.
- Para añadir `Fútbol 9`, inserta tipo y añade botón filtro en `frontend/index.html:70`.
- Producción: cambia `SECRET_KEY`, usa `HTTPS`, `Flask-JWT-Extended` con refresh, `gunicorn`, y `.env` fuera del repo (añade `backend/.env` a `.gitignore`).

---

## 📤 Subir cambios a GitHub

```bash
cd Cancha-sintetica
git status
git add .
git commit -m "docs: README detallado paso a paso"
git push origin main
```
Siempre desde `Cancha-sintetica/` (no desde `CANCHA/` padre).

