"""
auth.py - Helpers de autenticación y autorización con JWT
- Roles: 'cliente' y 'administrador' totalmente separados
- Un token de cliente JAMÁS podrá acceder a rutas /api/admin/*
"""
import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from config import Config

def generar_token(usuario_id, email, rol):
    """Genera JWT con payload: id, email, rol, exp"""
    payload = {
        "id": usuario_id,
        "email": email,
        "rol": rol, # 'cliente' o 'administrador'
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")
    return token

def decodificar_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_requerido(f):
    """Decorator: exige token válido (cliente o admin)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"ok": False, "msg": "Token no proporcionado. Debes iniciar sesión."}), 401
        token = auth_header.split(" ")[1]
        payload = decodificar_token(token)
        if not payload:
            return jsonify({"ok": False, "msg": "Token inválido o expirado. Inicia sesión de nuevo."}), 401
        # Inyecta usuario en request
        request.usuario = payload
        return f(*args, **kwargs)
    return decorated

def solo_cliente(f):
    """Decorator: solo permite rol 'cliente'"""
    @wraps(f)
    @token_requerido
    def decorated(*args, **kwargs):
        if request.usuario.get("rol") != "cliente":
            return jsonify({"ok": False, "msg": "Acceso denegado. Se requiere cuenta de Cliente."}), 403
        return f(*args, **kwargs)
    return decorated

def solo_admin(f):
    """Decorator: solo permite rol 'administrador' - BLOQUEA a clientes"""
    @wraps(f)
    @token_requerido
    def decorated(*args, **kwargs):
        if request.usuario.get("rol") != "administrador":
            return jsonify({"ok": False, "msg": "Acceso denegado. Solo Administradores. Ningún cliente puede acceder al panel."}), 403
        return f(*args, **kwargs)
    return decorated
