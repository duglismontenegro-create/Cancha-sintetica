-- =====================================================
-- schema.sql - BD reservas_cancha (tu BD exacta + campos necesarios para el proyecto)
-- Ejecutar en MySQL Workbench: SOURCE schema.sql  o copia/pega
-- Base: tu脚本 + password_hash + precio_por_hora + columnas de reserva compatibles
-- =====================================================

DROP DATABASE IF EXISTS reservas_cancha;
CREATE DATABASE reservas_cancha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reservas_cancha;

-- 1. Administradores (tu tabla + password_hash y created_at para login)
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    rol VARCHAR(50) DEFAULT 'Administrador',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Clientes (tu tabla + password_hash y created_at)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Canchas (tu tabla + precio, descripcion, imagen para backend)
CREATE TABLE canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- Fútbol 5, Fútbol 7, Fútbol 8, Fútbol 11
    estado VARCHAR(50) DEFAULT 'Disponible', -- Disponible / Mantenimiento
    precio_por_hora DECIMAL(10,2) NOT NULL DEFAULT 80000.00,
    descripcion TEXT NULL,
    imagen_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Reservas (tu tabla + columnas que usa el backend, ambas conviven)
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    cancha_id INT,
    fecha_hora DATETIME NOT NULL, -- tu columna original (se mantiene)
    fecha DATE NULL, -- usada por backend (fecha)
    hora_inicio TIME NULL, -- usada por backend
    duracion_horas DECIMAL(4,2) NULL, -- usada por backend
    hora_fin TIME NULL, -- usada por backend
    costo_total DECIMAL(10,2) NULL, -- usada por backend
    estado VARCHAR(50) DEFAULT 'Confirmada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    INDEX idx_fecha_cancha (fecha, cancha_id)
) ENGINE=InnoDB;

-- 5. Mantenimiento (tu tabla intacta)
CREATE TABLE mantenimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancha_id INT,
    descripcion TEXT NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- DATOS - Tus inserts exactos + password_hash / precios / reservas compatibles
-- Passwords: Admins -> Admin123*  | Clientes -> 123456
-- Generados con: generate_password_hash('Admin123*') / generate_password_hash('123456')
-- =====================================================

INSERT INTO administradores (nombre, email, telefono, rol, password_hash) VALUES 
('Laura Jiménez', 'laura.admin@reservas.com', '3104445566', 'Super Admin', 'scrypt:32768:8:1$geqCJPM4RYAwZs0b$d5f456d51833a6d125d12a9c2343ce7125b686c108e047856ab665c007c6523be409d91b590a958acb6bfec5815396b2478d81a1ca9b92bf171efa61aeff672e'),
('Andrés Parra', 'andres.admin@reservas.com', '3207778899', 'Gestor de Canchas', 'scrypt:32768:8:1$geqCJPM4RYAwZs0b$d5f456d51833a6d125d12a9c2343ce7125b686c108e047856ab665c007c6523be409d91b590a958acb6bfec5815396b2478d81a1ca9b92bf171efa61aeff672e');

INSERT INTO clientes (nombre, telefono, email, password_hash) VALUES 
('Carlos Pérez', '3001234567', 'carlos@email.com', 'scrypt:32768:8:1$gKoFfG6DdWdNlHKt$85f0831d44f53c2b074ae9f8bcb17436755a0c40affa43dd948ba2c9ecd197181afa82cf6b451a819b96fdbd785f0465945ff45dea032f6a415954119174bbd9'),
('Ana Gómez', '3109876543', 'ana@email.com', 'scrypt:32768:8:1$gKoFfG6DdWdNlHKt$85f0831d44f53c2b074ae9f8bcb17436755a0c40affa43dd948ba2c9ecd197181afa82cf6b451a819b96fdbd785f0465945ff45dea032f6a415954119174bbd9'),
('Sofía Martínez', '3112223344', 'sofia@email.com', 'scrypt:32768:8:1$gKoFfG6DdWdNlHKt$85f0831d44f53c2b074ae9f8bcb17436755a0c40affa43dd948ba2c9ecd197181afa82cf6b451a819b96fdbd785f0465945ff45dea032f6a415954119174bbd9'),
('Mateo Rodríguez', '3123334455', 'mateo@email.com', 'scrypt:32768:8:1$gKoFfG6DdWdNlHKt$85f0831d44f53c2b074ae9f8bcb17436755a0c40affa43dd948ba2c9ecd197181afa82cf6b451a819b96fdbd785f0465945ff45dea032f6a415954119174bbd9');

INSERT INTO canchas (nombre, tipo, estado, precio_por_hora, descripcion, imagen_url) VALUES 
('Cancha Principal', 'Fútbol 11', 'Disponible', 250000.00, 'Cancha reglamentaria Fútbol 11, graderías', 'https://via.placeholder.com/400x250?text=Futbol+11'),
('Cancha Norte', 'Fútbol 5', 'Disponible', 80000.00, 'Grama sintética Fútbol 5, iluminación LED', 'https://via.placeholder.com/400x250?text=Futbol+5'),
('Cancha Sur', 'Fútbol 7', 'Disponible', 120000.00, 'Ideal para torneos Fútbol 7', 'https://via.placeholder.com/400x250?text=Futbol+7'),
('Cancha El Golazo', 'Fútbol 8', 'Disponible', 150000.00, 'Fútbol 8 con camerinos', 'https://via.placeholder.com/400x250?text=Futbol+8'),
('Cancha El Bosque', 'Fútbol 5', 'Mantenimiento', 80000.00, 'En mantenimiento cambio de caucho', 'https://via.placeholder.com/400x250?text=Mantenimiento');

-- Reservas: se insertan ambas columnas (fecha_hora para tu esquema + fecha/hora_inicio etc para backend)
INSERT INTO reservas (cliente_id, cancha_id, fecha_hora, fecha, hora_inicio, duracion_horas, hora_fin, costo_total, estado) VALUES 
(1, 1, '2026-09-15 18:00:00', '2026-09-15', '18:00:00', 1.00, '19:00:00', 250000.00, 'Confirmada'),
(2, 2, '2026-09-15 20:00:00', '2026-09-15', '20:00:00', 1.00, '21:00:00', 80000.00, 'Confirmada'),
(3, 3, '2026-09-16 19:00:00', '2026-09-16', '19:00:00', 1.00, '20:00:00', 120000.00, 'Pendiente');

INSERT INTO mantenimiento (cancha_id, descripcion, fecha_mantenimiento) VALUES 
(5, 'Cambio de caucho sintético y reparación de mallas', '2026-09-10');

UPDATE canchas 
SET nombre = 'Cancha Veo le digo' 
WHERE id = 1;
