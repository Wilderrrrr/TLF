const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('🚀 Iniciando migración de base de datos...');
    
    // Crear tablas de gastos fijos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gastos_fijos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        descripcion VARCHAR(255) NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla gastos_fijos lista');

    // Crear tabla de configuración
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(50) PRIMARY KEY,
        valor VARCHAR(255) NOT NULL
      )
    `);
    console.log('✅ Tabla configuracion lista');

    // Crear tabla de productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla productos lista');

    // Crear tabla de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        documento VARCHAR(50) UNIQUE,
        telefono VARCHAR(20),
        deuda DECIMAL(10, 2) DEFAULT 0.00,
        notas TEXT,
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla clientes lista');

    // Crear tabla de movimientos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('venta', 'gasto', 'abono') NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        descripcion VARCHAR(255),
        fecha DATE NOT NULL,
        cliente_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla movimientos lista');

    // Asegurar que las columnas nuevas existan (en caso de que la tabla ya existiera previo a esta actualización)
    try {
      await pool.query("ALTER TABLE movimientos MODIFY COLUMN tipo ENUM('venta', 'gasto', 'abono') NOT NULL");
      const [cols] = await pool.query("SHOW COLUMNS FROM movimientos LIKE 'cliente_id'");
      if (cols.length === 0) {
        await pool.query("ALTER TABLE movimientos ADD COLUMN cliente_id INT NULL");
        await pool.query("ALTER TABLE movimientos ADD CONSTRAINT fk_movimientos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL");
      }
      console.log('✅ Estructura de movimientos actualizada');
    } catch (e) {
      console.log('ℹ️ Estructura de movimientos ya estaba actualizada');
    }

    // Crear tabla de relación venta-productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venta_productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        movimiento_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    console.log('✅ Tabla venta_productos lista');

    // Meta inicial
    await pool.query("INSERT IGNORE INTO configuracion (clave, valor) VALUES ('meta_mensual', '10000')");
    console.log('✅ Meta mensual inicial establecida');

    // Tabla de Usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla usuarios lista');

    // Usuario Admin por defecto
    await pool.query(`
      INSERT IGNORE INTO usuarios (nombre, usuario, email, password, rol) 
      VALUES ('Administrador', 'admin', 'admin@tlf.com', '$2a$10$X7l.O/R1pD/N.7mG.W.C.eK.y5uV/X7l.O/R1pD/N.7mG.W.C.eK.y', 'admin')
    `);
    console.log('✅ Usuario admin inicial creado');

    console.log('🎉 Migración completada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
