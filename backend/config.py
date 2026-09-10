"""
config.py - Configuración centralizada del Backend
"""
import os
from dotenv import load_dotenv

# Carga variables del archivo .env si existe
load_dotenv()

class Config:
    # MySQL
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "canchas_db")

    # Seguridad
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_cambiar_en_produccion")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))

    # Negocio
    TIEMPO_LLEGADA_ANTICIPADA_MIN = 15  # Recomendación: llegar 15 min antes
    PAYMENT_INSTRUCTIONS = os.getenv(
        "PAYMENT_INSTRUCTIONS",
        "Realiza el pago por Nequi/Bancolombia al 300-123-4567 o directamente en recepción antes del partido. Envía el comprobante al WhatsApp 300-123-4567."
    )
