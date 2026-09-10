"""
app.py - Backend Flask para Sistema de Reservas de Canchas Sintéticas
Stack: Flask + MySQL (mysql-connector) + JWT + Werkzeug Security

Estructura de Rutas:
- POST /api/clientes/registro          -> Registro independiente Clientes
- POST /api/clientes/login             -> Login Clientes
- POST /api/admin/login                -> Login EXCLUSIVO Administradores (tabla administradores)
- GET  /api/canchas                     -> Catálogo visual (público)
- GET  /api/canchas/<id>               -> Detalle cancha
- POST /api/reservas                    -> Crear reserva (OBLIGA login cliente)
- GET  /api/reservas/mis-reservas      -> Historial cliente
- GET  /api/admin/reservas             -> [ADMIN] todas las reservas
- PUT  /api/admin/canchas/<id>/estado  -> [ADMIN] cambiar Disponible/Mantenimiento
- GET  /api/admin/canchas              -> [ADMIN] listado completo

Seguridad:
- Clientes y Admins en tablas SEPARADAS, tokens con rol distinto
- Ningún cliente puede acceder a /api/admin/* (decorator solo_admin)
- Passwords hasheados con werkzeug.security
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, time
import re

from config import Config
from database import get_db_connection, get_cursor_dict
from auth import generar_token, solo_cliente, solo_admin

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY

# CORS: permite que el frontend (Live Server, file://, etc.) consuma la API
CORS(app, supports_credentials=True, origins="*")

# ======================================================
# HELPERS
# ======================================================

def validar_email(email):
    return re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email) is not None

def calcular_hora_fin(hora_inicio_str, duracion_horas):
    """hora_inicio_str: '14:30', duracion: 1.5 -> '16:00'"""
    h, m = map(int, hora_inicio_str.split(":"))
    total_min = h*60 + m + int(float(duracion_horas)*60)
    total_min %= 24*60
    return f"{total_min//60:02d}:{total_min%60:02d}:00"

def hay_solapamiento_reserva(cancha_id, fecha, hora_inicio_str, duracion):
    """
    Verifica si existe solapamiento con reservas existentes.
    Retorna True si HAY conflicto.
    """
    conn = get_db_connection()
    if not conn:
        return True # Falla segura: bloquea reserva si no hay DB
    try:
        cursor = get_cursor_dict(conn)
        # Trae reservas del mismo día y cancha
        cursor.execute("""
            SELECT hora_inicio, duracion_horas FROM reservas
            WHERE cancha_id=%s AND fecha=%s AND estado != 'Cancelada'
        """, (cancha_id, fecha))
        reservas = cursor.fetchall()

        # Convertir nueva reserva a minutos desde 00:00
        h_new, m_new = map(int, hora_inicio_str.split(":"))
        start_new = h_new*60 + m_new
        end_new = start_new + int(float(duracion)*60)

        for r in reservas:
            # r['hora_inicio'] es timedelta
            t = r['hora_inicio']
            # mysql-connector retorna timedelta para TIME
            if isinstance(t, timedelta):
                start_exist = int(t.total_seconds() // 60)
            else:
                # fallback si es string/time
                h_e, m_e = map(int, str(t).split(":")[:2])
                start_exist = h_e*60 + m_e
            end_exist = start_exist + int(float(r['duracion_horas'])*60)

            # Solapamiento si: start_new < end_exist AND end_new > start_exist
            if start_new < end_exist and end_new > start_exist:
                return True
        return False
    finally:
        conn.close()

# ======================================================
# RUTAS PÚBLICAS Y AUTENTICACIÓN
# ======================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "ok": True,
        "msg": "API Canchas Sintéticas activa",
        "endpoints": [
            "POST /api/clientes/registro",
            "POST /api/clientes/login",
            "POST /api/admin/login",
            "GET /api/canchas",
            "POST /api/reservas (requiere token cliente)"
        ]
    })

# ---------- REGISTRO CLIENTES ----------
@app.route("/api/clientes/registro", methods=["POST"])
def registro_cliente():
    data = request.get_json() or {}
    nombre = data.get("nombre", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    telefono = data.get("telefono", "").strip()

    # Validaciones
    if not nombre or not email or not password:
        return jsonify({"ok": False, "msg": "Nombre, email y contraseña son obligatorios"}), 400
    if not validar_email(email):
        return jsonify({"ok": False, "msg": "Email no válido"}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "msg": "La contraseña debe tener mínimo 6 caracteres"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        # ¿Email ya existe en clientes o administradores?
        cursor.execute("SELECT id FROM clientes WHERE email=%s", (email,))
        if cursor.fetchone():
            return jsonify({"ok": False, "msg": "Este email ya está registrado como cliente"}), 409

        password_hash = generate_password_hash(password)
        cursor.execute("""
            INSERT INTO clientes (nombre, email, password_hash, telefono)
            VALUES (%s, %s, %s, %s)
        """, (nombre, email, password_hash, telefono))
        conn.commit()
        cliente_id = cursor.lastrowid

        token = generar_token(cliente_id, email, "cliente")
        return jsonify({
            "ok": True,
            "msg": "Registro exitoso",
            "token": token,
            "usuario": {"id": cliente_id, "nombre": nombre, "email": email, "rol": "cliente"}
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"ok": False, "msg": f"Error en registro: {str(e)}"}), 500
    finally:
        conn.close()

# ---------- LOGIN CLIENTES ----------
@app.route("/api/clientes/login", methods=["POST"])
def login_cliente():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"ok": False, "msg": "Email y contraseña requeridos"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("SELECT id, nombre, email, password_hash FROM clientes WHERE email=%s", (email,))
        user = cursor.fetchone()
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"ok": False, "msg": "Credenciales inválidas"}), 401

        token = generar_token(user["id"], user["email"], "cliente")
        return jsonify({
            "ok": True,
            "msg": "Login cliente exitoso",
            "token": token,
            "usuario": {"id": user["id"], "nombre": user["nombre"], "email": user["email"], "rol": "cliente"}
        })
    finally:
        conn.close()

# ---------- LOGIN ADMINISTRADORES (EXCLUSIVO) ----------
@app.route("/api/admin/login", methods=["POST"])
def login_admin():
    """
    IMPORTANTE: Esta ruta consulta ÚNICAMENTE la tabla 'administradores'.
    Un cliente NUNCA podrá loguearse aquí aunque use el mismo email.
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"ok": False, "msg": "Email y contraseña requeridos"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("SELECT id, nombre, email, password_hash FROM administradores WHERE email=%s", (email,))
        admin = cursor.fetchone()
        if not admin or not check_password_hash(admin["password_hash"], password):
            return jsonify({"ok": False, "msg": "Credenciales de administrador inválidas"}), 401

        token = generar_token(admin["id"], admin["email"], "administrador")
        return jsonify({
            "ok": True,
            "msg": "Login administrador exitoso",
            "token": token,
            "usuario": {"id": admin["id"], "nombre": admin["nombre"], "email": admin["email"], "rol": "administrador"}
        })
    finally:
        conn.close()

# ======================================================
# CATÁLOGO DE CANCHAS
# ======================================================

@app.route("/api/canchas", methods=["GET"])
def listar_canchas():
    """Público: retorna canchas con estado Disponible / Mantenimiento"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        # Filtro opcional ?estado=Disponible o ?tipo=Fútbol 5
        estado = request.args.get("estado")
        tipo = request.args.get("tipo")
        query = "SELECT id, nombre, tipo, estado, precio_por_hora, descripcion, imagen_url FROM canchas WHERE 1=1"
        params = []
        if estado in ["Disponible", "Mantenimiento"]:
            query += " AND estado=%s"
            params.append(estado)
        if tipo:
            query += " AND tipo=%s"
            params.append(tipo)
        query += " ORDER BY FIELD(estado,'Disponible','Mantenimiento'), tipo"

        cursor.execute(query, params)
        canchas = cursor.fetchall()
        # Convertir Decimal a float para JSON
        for c in canchas:
            c["precio_por_hora"] = float(c["precio_por_hora"])
        return jsonify({"ok": True, "canchas": canchas})
    finally:
        conn.close()

@app.route("/api/canchas/<int:cancha_id>", methods=["GET"])
def detalle_cancha(cancha_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("SELECT * FROM canchas WHERE id=%s", (cancha_id,))
        cancha = cursor.fetchone()
        if not cancha:
            return jsonify({"ok": False, "msg": "Cancha no encontrada"}), 404
        cancha["precio_por_hora"] = float(cancha["precio_por_hora"])
        # Convertir TIME/TIMESTAMP a string si hace falta
        return jsonify({"ok": True, "cancha": cancha})
    finally:
        conn.close()

# ======================================================
# RESERVAS - REQUIERE LOGIN CLIENTE
# ======================================================

@app.route("/api/reservas", methods=["POST"])
@solo_cliente  # <--- OBLIGATORIO estar logueado como cliente
def crear_reserva():
    """
    Flujo: cliente logueado envía {cancha_id, fecha, hora_inicio, duracion_horas}
    Validaciones: cancha Disponible, no solapamiento, fecha futura
    Respuesta: incluye instrucciones de pago, tiempo límite llegada, resumen costo
    """
    data = request.get_json() or {}
    cancha_id = data.get("cancha_id")
    fecha = data.get("fecha")  # '2026-09-15'
    hora_inicio = data.get("hora_inicio")  # '14:00' o '14:00:00'
    duracion = data.get("duracion_horas")  # 1, 1.5, 2

    # Validaciones básicas
    if not all([cancha_id, fecha, hora_inicio, duracion]):
        return jsonify({"ok": False, "msg": "Faltan datos: cancha_id, fecha, hora_inicio, duracion_horas"}), 400

    try:
        duracion = float(duracion)
        if duracion not in [0.5, 1, 1.5, 2, 2.5, 3]:
            # Permitimos 0.5 a 3 horas en pasos de 0.5
            if duracion <=0 or duracion > 4:
                return jsonify({"ok": False, "msg": "Duración no válida (0.5 a 4 horas)"}), 400
    except:
        return jsonify({"ok": False, "msg": "Duración debe ser numérica"}), 400

    # Normalizar hora_inicio a HH:MM
    if len(hora_inicio.split(":")) == 3:
        hora_inicio = ":".join(hora_inicio.split(":")[:2])

    # Validar fecha no pasada
    try:
        fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
        if fecha_obj < datetime.now().date():
            return jsonify({"ok": False, "msg": "No puedes reservar en fechas pasadas"}), 400
    except ValueError:
        return jsonify({"ok": False, "msg": "Formato fecha inválido, use YYYY-MM-DD"}), 400

    cliente_id = request.usuario["id"]

    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        # 1. Verificar cancha existe y está Disponible
        cursor.execute("SELECT id, nombre, tipo, estado, precio_por_hora FROM canchas WHERE id=%s", (cancha_id,))
        cancha = cursor.fetchone()
        if not cancha:
            return jsonify({"ok": False, "msg": "Cancha no encontrada"}), 404
        if cancha["estado"] != "Disponible":
            return jsonify({"ok": False, "msg": f"La cancha '{cancha['nombre']}' está en Mantenimiento y no se puede reservar"}), 400

        # 2. Verificar solapamiento
        if hay_solapamiento_reserva(cancha_id, fecha, hora_inicio, duracion):
            return jsonify({"ok": False, "msg": "Horario no disponible. Ya existe una reserva en ese rango. Elige otra hora."}), 409

        # 3. Calcular hora_fin y costo
        hora_fin = calcular_hora_fin(hora_inicio, duracion)
        precio_hora = float(cancha["precio_por_hora"])
        costo_total = round(precio_hora * duracion, 2)
        # Para guardar hora_fin con formato completo
        hora_inicio_db = f"{hora_inicio}:00" if len(hora_inicio.split(':'))==2 else hora_inicio

        # 4. Insertar reserva
        cursor.execute("""
            INSERT INTO reservas (cliente_id, cancha_id, fecha, hora_inicio, duracion_horas, hora_fin, costo_total, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Confirmada')
        """, (cliente_id, cancha_id, fecha, hora_inicio_db, duracion, hora_fin, costo_total))
        conn.commit()
        reserva_id = cursor.lastrowid

        # 5. Respuesta enriquecida para ventana/modal post-reserva
        return jsonify({
            "ok": True,
            "msg": "¡Reserva confirmada con éxito!",
            "reserva": {
                "id": reserva_id,
                "cancha": cancha["nombre"],
                "tipo": cancha["tipo"],
                "fecha": fecha,
                "hora_inicio": hora_inicio_db,
                "hora_fin": hora_fin,
                "duracion_horas": duracion,
                "costo_total": costo_total,
                "precio_por_hora": precio_hora
            },
            "instrucciones_pago": Config.PAYMENT_INSTRUCTIONS,
            "tiempo_llegada": f"Llega {Config.TIEMPO_LLEGADA_ANTICIPADA_MIN} minutos antes del partido para calentamiento y verificación. Tu hora de ingreso recomendada es a las {hora_inicio} - {Config.TIEMPO_LLEGADA_ANTICIPADA_MIN} min.",
            "resumen": f"Has reservado '{cancha['nombre']}' ({cancha['tipo']}) el {fecha} de {hora_inicio_db} a {hora_fin} ({duracion} hora(s)). Costo estimado: ${costo_total:,.0f} COP."
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"ok": False, "msg": f"Error al crear reserva: {str(e)}"}), 500
    finally:
        conn.close()

@app.route("/api/reservas/mis-reservas", methods=["GET"])
@solo_cliente
def mis_reservas():
    cliente_id = request.usuario["id"]
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("""
            SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin, r.duracion_horas, r.costo_total, r.estado,
                   c.nombre as cancha_nombre, c.tipo
            FROM reservas r
            JOIN canchas c ON r.cancha_id = c.id
            WHERE r.cliente_id=%s
            ORDER BY r.fecha DESC, r.hora_inicio DESC
        """, (cliente_id,))
        reservas = cursor.fetchall()
        for r in reservas:
            r["costo_total"] = float(r["costo_total"])
            r["duracion_horas"] = float(r["duracion_horas"])
            # TIME a string
            r["hora_inicio"] = str(r["hora_inicio"])
            r["hora_fin"] = str(r["hora_fin"])
            r["fecha"] = str(r["fecha"])
        return jsonify({"ok": True, "reservas": reservas})
    finally:
        conn.close()

# ======================================================
# PANEL ADMIN - SOLO ADMINISTRADORES
# ======================================================

@app.route("/api/admin/canchas", methods=["GET"])
@solo_admin
def admin_listar_canchas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("SELECT * FROM canchas ORDER BY id")
        canchas = cursor.fetchall()
        for c in canchas:
            c["precio_por_hora"] = float(c["precio_por_hora"])
        return jsonify({"ok": True, "canchas": canchas})
    finally:
        conn.close()

@app.route("/api/admin/canchas/<int:cancha_id>/estado", methods=["PUT"])
@solo_admin
def admin_cambiar_estado(cancha_id):
    data = request.get_json() or {}
    nuevo_estado = data.get("estado")
    if nuevo_estado not in ["Disponible", "Mantenimiento"]:
        return jsonify({"ok": False, "msg": "Estado debe ser 'Disponible' o 'Mantenimiento'"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("UPDATE canchas SET estado=%s WHERE id=%s", (nuevo_estado, cancha_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"ok": False, "msg": "Cancha no encontrada"}), 404
        return jsonify({"ok": True, "msg": f"Cancha {cancha_id} ahora está en {nuevo_estado}"})
    finally:
        conn.close()

@app.route("/api/admin/reservas", methods=["GET"])
@solo_admin
def admin_listar_reservas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("""
            SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin, r.duracion_horas, r.costo_total, r.estado,
                   c.nombre as cancha_nombre, c.tipo as cancha_tipo,
                   cl.nombre as cliente_nombre, cl.email as cliente_email
            FROM reservas r
            JOIN canchas c ON r.cancha_id = c.id
            JOIN clientes cl ON r.cliente_id = cl.id
            ORDER BY r.fecha DESC, r.hora_inicio DESC
        """)
        reservas = cursor.fetchall()
        for r in reservas:
            r["costo_total"] = float(r["costo_total"])
            r["duracion_horas"] = float(r["duracion_horas"])
            r["hora_inicio"] = str(r["hora_inicio"])
            r["hora_fin"] = str(r["hora_fin"])
            r["fecha"] = str(r["fecha"])
        return jsonify({"ok": True, "reservas": reservas})
    finally:
        conn.close()

@app.route("/api/admin/reservas/<int:reserva_id>/estado", methods=["PUT"])
@solo_admin
def admin_cambiar_estado_reserva(reserva_id):
    data = request.get_json() or {}
    nuevo_estado = data.get("estado")
    if nuevo_estado not in ["Confirmada", "Cancelada", "Pendiente"]:
        return jsonify({"ok": False, "msg": "Estado inválido"}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({"ok": False, "msg": "Error de conexión a BD"}), 500
    try:
        cursor = get_cursor_dict(conn)
        cursor.execute("UPDATE reservas SET estado=%s WHERE id=%s", (nuevo_estado, reserva_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"ok": False, "msg": "Reserva no encontrada"}), 404
        return jsonify({"ok": True, "msg": f"Reserva {reserva_id} actualizada a {nuevo_estado}"})
    finally:
        conn.close()


# ======================================================
# RUN
# ======================================================
if __name__ == "__main__":
    print("="*60)
    print(" API Canchas Sintéticas - Flask")
    print(" - Cliente: POST /api/clientes/registro, /api/clientes/login")
    print(" - Admin  : POST /api/admin/login  (tabla administradores)")
    print(" - Canchas: GET /api/canchas")
    print(" - Reserva: POST /api/reservas (requiere Bearer token cliente)")
    print("="*60)
    # debug=True solo en desarrollo
    app.run(host="0.0.0.0", port=5000, debug=True)
