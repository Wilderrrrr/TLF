-- ==========================================================
-- ESTRUCTURA PROFESIONAL DE BASE DE DATOS - THE LUX FOSTER ADMIN
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CONFIGURACIÓN GLOBAL
DROP TABLE IF EXISTS configuracion;
CREATE TABLE configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL
);

-- 2. GASTOS FIJOS (PLANTILLAS)
DROP TABLE IF EXISTS gastos_fijos;
CREATE TABLE gastos_fijos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USUARIOS DEL SISTEMA
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. CLIENTES (CARTERA Y DEUDAS)
DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    documento VARCHAR(50) UNIQUE,
    telefono VARCHAR(20),
    deuda DECIMAL(10, 2) DEFAULT 0.00,
    notas TEXT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. PRODUCTOS (INVENTARIO)
DROP TABLE IF EXISTS productos;
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT NULL,
    maneja_stock BOOLEAN DEFAULT TRUE,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. MOVIMIENTOS (CAJA REAL)
DROP TABLE IF EXISTS movimientos;
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('venta', 'gasto', 'abono') NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    descripcion VARCHAR(255),
    fecha DATE NOT NULL,
    cliente_id INT NULL,
    metodo_pago ENUM('Efectivo', 'Transferencia') DEFAULT 'Efectivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- 7. RELACIÓN VENTAS-PRODUCTOS
DROP TABLE IF EXISTS venta_productos;
CREATE TABLE venta_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- DATOS INICIALES DE PRODUCCIÓN
-- ==========================================================

-- Meta mensual por defecto
INSERT INTO configuracion (clave, valor) VALUES ('meta_mensual', '10000');

-- Usuario Administrador Maestro
-- Password: admin123 (Hash Bcrypt real)
INSERT INTO usuarios (nombre, usuario, email, password, rol) 
VALUES (
    'Administrador', 
    'admin', 
    'admin@theluxfoster.com', 
    '$2b$10$PWIeFCjcIYzGBh/NAqPj6eST74Rv0m3b9E/5KuPLeXi3UvqGHUTjC', 
    'admin'
);
