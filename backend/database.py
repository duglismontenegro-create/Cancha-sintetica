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
