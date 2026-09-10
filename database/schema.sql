-- =====================================================
-- schema.sql - Estructura MySQL para Sistema de Canchas
-- Ejecutar en MySQL Workbench o CLI: SOURCE schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS canchas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE canchas_db;

-- 1. Tabla Clientes (registro independiente)
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla Administradores (LOGIN EXCLUSIVO Y SEGURO)
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabla Canchas
CREATE TABLE IF NOT EXISTS canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Ej: Cancha 1 - Fútbol 5
    tipo ENUM('Fútbol 5', 'Fútbol 7', 'Fútbol 8', 'Fútbol 11') NOT NULL,
    estado ENUM('Disponible', 'Mantenimiento') NOT NULL DEFAULT 'Disponible',
    precio_por_hora DECIMAL(10,2) NOT NULL,
    descripcion TEXT NULL,
    imagen_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabla Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    cancha_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracion_horas DECIMAL(4,2) NOT NULL, -- Ej: 1, 1.5, 2
    hora_fin TIME NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    estado ENUM('Pendiente','Confirmada','Cancelada') NOT NULL DEFAULT 'Confirmada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    -- Evita doble reserva exacta (misma cancha, misma fecha y hora inicio)
    UNIQUE KEY uq_reserva_slot (cancha_id, fecha, hora_inicio),
    INDEX idx_fecha_cancha (fecha, cancha_id)
) ENGINE=InnoDB;

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Insertar canchas de ejemplo (4 tipos + mantenimiento)
INSERT INTO canchas (nombre, tipo, estado, precio_por_hora, descripcion, imagen_url) VALUES
('Cancha Central', 'Fútbol 5', 'Disponible', 80000.00, 'Grama sintética profesional, iluminación LED', 'https://via.placeholder.com/400x250?text=Futbol+5'),
('Cancha Norte', 'Fútbol 7', 'Disponible', 120000.00, 'Ideal para torneos, camerinos incluidos', 'https://via.placeholder.com/400x250?text=Futbol+7'),
('Cancha Sur', 'Fútbol 8', 'Mantenimiento', 150000.00, 'En mantenimiento hasta el 15/09 - cambio de grama', 'https://via.placeholder.com/400x250?text=Mantenimiento'),
('Cancha Estadio', 'Fútbol 11', 'Disponible', 250000.00, 'Medidas reglamentarias, graderías', 'https://via.placeholder.com/400x250?text=Futbol+11'),
('Cancha Premium 5', 'Fútbol 5', 'Mantenimiento', 90000.00, 'Mantenimiento preventivo programado', 'https://via.placeholder.com/400x250?text=Mantenimiento+5')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Crear admin por defecto: email admin@canchas.com / password Admin123*
-- El hash debe generarse en Python. Ejemplo hash para 'Admin123*':
-- from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin123*'))
-- Reemplaza el hash de abajo por el que generes localmente si es necesario.
INSERT INTO administradores (nombre, email, password_hash) VALUES
('Administrador Principal', 'admin@canchas.com', 'scrypt:32768:8:1$...REEMPLAZAR_HASH_REAL...')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Nota: Si el hash de arriba no funciona, ejecuta en Python:
-- python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin123*'))"
-- y haz UPDATE administradores SET password_hash='hash_generado' WHERE email='admin@canchas.com';
