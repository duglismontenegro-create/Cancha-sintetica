"""
database.py - Conexión a MySQL
Usa mysql-connector-python. Cada request abre y cierra conexión.
"""
import mysql.connector
from mysql.connector import Error
from config import Config

def get_db_connection():
    """Retorna una conexión MySQL. Llamar y cerrar con conn.close()"""
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            autocommit=False
        )
        return conn
    except Error as e:
        print(f"[DB ERROR] No se pudo conectar a MySQL: {e}")
        return None

def get_cursor_dict(conn):
    """Cursor que retorna filas como diccionarios (clave: nombre columna)"""
    return conn.cursor(dictionary=True, buffered=True)

def ensure_db_compatible():
    """Auto-migración: agrega columnas faltantes si la BD es la antigua (imagen Workbench)"""
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        # Helper para verificar columna
        def has_column(table, col):
            cur.execute(f"SHOW COLUMNS FROM {table} LIKE %s", (col,))
            return cur.fetchone() is not None

        # administradores
        if not has_column("administradores", "password_hash"):
            try:
                cur.execute("ALTER TABLE administradores ADD COLUMN password_hash VARCHAR(255) NULL AFTER email")
                print("[MIGRACION] administradores.password_hash agregado")
            except Exception as e:
                print(f"[MIGRACION ERR] administradores.password_hash: {e}")
        if not has_column("administradores", "created_at"):
            try:
                cur.execute("ALTER TABLE administradores ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            except: pass

        # clientes
        if not has_column("clientes", "password_hash"):
            try:
                cur.execute("ALTER TABLE clientes ADD COLUMN password_hash VARCHAR(255) NULL AFTER email")
                print("[MIGRACION] clientes.password_hash agregado")
            except Exception as e:
                print(f"[MIGRACION ERR] clientes.password_hash: {e}")
        if not has_column("clientes", "created_at"):
            try:
                cur.execute("ALTER TABLE clientes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            except: pass

        # canchas
        if not has_column("canchas", "precio_por_hora"):
            try:
                cur.execute("ALTER TABLE canchas ADD COLUMN precio_por_hora DECIMAL(10,2) NOT NULL DEFAULT 80000.00")
                print("[MIGRACION] canchas.precio_por_hora agregado")
            except: pass
        if not has_column("canchas", "descripcion"):
            try:
                cur.execute("ALTER TABLE canchas ADD COLUMN descripcion TEXT NULL")
            except: pass
        if not has_column("canchas", "imagen_url"):
            try:
                cur.execute("ALTER TABLE canchas ADD COLUMN imagen_url VARCHAR(255) NULL")
            except: pass
        if not has_column("canchas", "created_at"):
            try:
                cur.execute("ALTER TABLE canchas ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            except: pass

        # reservas
        for col, ddl in [
            ("fecha", "ADD COLUMN fecha DATE NULL AFTER cancha_id"),
            ("hora_inicio", "ADD COLUMN hora_inicio TIME NULL AFTER fecha"),
            ("duracion_horas", "ADD COLUMN duracion_horas DECIMAL(4,2) NULL AFTER hora_inicio"),
            ("hora_fin", "ADD COLUMN hora_fin TIME NULL AFTER duracion_horas"),
            ("costo_total", "ADD COLUMN costo_total DECIMAL(10,2) NULL AFTER hora_fin"),
            ("created_at", "ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ]:
            if not has_column("reservas", col):
                try:
                    cur.execute(f"ALTER TABLE reservas {ddl}")
                    print(f"[MIGRACION] reservas.{col} agregado")
                except: pass

        conn.commit()

        # Si hay admins/clientes sin hash, asignar defaults para que login funcione
        try:
            from werkzeug.security import generate_password_hash
            cur.execute("SELECT id FROM administradores WHERE password_hash IS NULL")
            for (id_,) in cur.fetchall():
                cur.execute("UPDATE administradores SET password_hash=%s WHERE id=%s", (generate_password_hash('Admin123*'), id_))
            cur.execute("SELECT id FROM clientes WHERE password_hash IS NULL")
            for (id_,) in cur.fetchall():
                cur.execute("UPDATE clientes SET password_hash=%s WHERE id=%s", (generate_password_hash('123456'), id_))
            conn.commit()
        except: pass

        # Migrar fecha_hora -> fecha/hora_inicio si están vacías
        try:
            cur.execute("SELECT id, fecha_hora FROM reservas WHERE fecha IS NULL AND fecha_hora IS NOT NULL")
            for id_, fh in cur.fetchall():
                if fh:
                    fecha = fh.date() if hasattr(fh, 'date') else str(fh).split(' ')[0]
                    # fh es datetime
                    import datetime
                    if isinstance(fh, datetime.datetime):
                        hora_inicio = fh.time()
                        dt_fin = datetime.datetime.combine(fh.date(), hora_inicio) + datetime.timedelta(hours=1)
                        hora_fin = dt_fin.time()
                    else:
                        hora_inicio = "18:00:00"
                        hora_fin = "19:00:00"
                    cur.execute("SELECT precio_por_hora FROM canchas WHERE id=(SELECT cancha_id FROM reservas WHERE id=%s)", (id_,))
                    prow = cur.fetchone()
                    precio = float(prow[0]) if prow and prow[0] else 80000
                    cur.execute("UPDATE reservas SET fecha=%s, hora_inicio=%s, duracion_horas=1, hora_fin=%s, costo_total=%s WHERE id=%s", (fecha, hora_inicio, hora_fin, precio, id_))
            conn.commit()
        except: pass

    finally:
        conn.close()
