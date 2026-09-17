DROP DATABASE IF EXISTS reservas_cancha;

CREATE DATABASE reservas_cancha;
USE reservas_cancha;

CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    rol VARCHAR(50) DEFAULT 'Administrador'
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- Fútbol 5, Fútbol 7, Fútbol 8, Fútbol 11
    estado VARCHAR(50) DEFAULT 'Disponible'
);

CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    cancha_id INT,
    fecha_hora DATETIME NOT NULL,
    estado VARCHAR(50) DEFAULT 'Confirmada',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE
);


CREATE TABLE mantenimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancha_id INT,
    descripcion TEXT NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE
);

INSERT INTO administradores (nombre, email, telefono, rol) VALUES 
('Laura Jiménez', 'laura.admin@reservas.com', '3104445566', 'Super Admin'),
('Andrés Parra', 'andres.admin@reservas.com', '3207778899', 'Gestor de Canchas');

INSERT INTO clientes (nombre, telefono, email) VALUES 
('Carlos Pérez', '3001234567', 'carlos@email.com'),
('Ana Gómez', '3109876543', 'ana@email.com'),
('Sofía Martínez', '3112223344', 'sofia@email.com'),
('Mateo Rodríguez', '3123334455', 'mateo@email.com');

INSERT INTO canchas (nombre, tipo, estado) VALUES 
('Cancha Principal', 'Fútbol 11', 'Disponible'),
('Cancha Norte', 'Fútbol 5', 'Disponible'),
('Cancha Sur', 'Fútbol 7', 'Disponible'),
('Cancha El Golazo', 'Fútbol 8', 'Disponible'),
('Cancha El Bosque', 'Fútbol 5', 'Mantenimiento');

INSERT INTO reservas (cliente_id, cancha_id, fecha_hora, estado) VALUES 
(1, 1, '2026-09-15 18:00:00', 'Confirmada'),
(2, 2, '2026-09-15 20:00:00', 'Confirmada'),
(3, 3, '2026-09-16 19:00:00', 'Pendiente');

INSERT INTO mantenimiento (cancha_id, descripcion, fecha_mantenimiento) VALUES 
(5, 'Cambio de caucho sintético y reparación de mallas', '2026-09-10');

UPDATE canchas 
SET nombre = 'Cancha Veo le digo' 
WHERE id = 1;

INSERT INTO canchas (Nombre , tipo , estado) Values
('Cancha Se la siento', 'Futbol 8' ,'Disponible');