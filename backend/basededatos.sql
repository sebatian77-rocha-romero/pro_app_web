-- ============================================
-- ELIMINAR Y CREAR BASE DE DATOS
-- ============================================
DROP DATABASE IF EXISTS inventario;
CREATE DATABASE inventario;
USE inventario;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario'
);

-- ============================================
-- TABLA: categorias
-- ============================================
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria_id INT,
    cantidad INT DEFAULT 0,
    precio DECIMAL(10,2),
    usuario_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================
-- INSERTAR USUARIO ADMIN (contraseña: admin123)
-- ============================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Admin', 'admin@inventario.com', '$2b$10$3XkLqWZxY9vXoR5tV7uM6O8aBcDfGhIjKlMnOpQrStUvWxYz1A2B3C4D', 'admin');

-- ============================================
-- INSERTAR CATEGORIAS (usuario_id = 1)
-- ============================================
INSERT INTO categorias (nombre, descripcion, usuario_id) VALUES
('Electronica', 'Productos electronicos y tecnologicos', 1),
('Ropa', 'Prendas de vestir y accesorios', 1),
('Alimentos', 'Productos alimenticios y bebidas', 1),
('Hogar', 'Articulos para el hogar y decoracion', 1),
('Juguetes', 'Juguetes y juegos para ninos', 1),
('Deportes', 'Equipo deportivo y accesorios', 1),
('Libros', 'Libros, revistas y material educativo', 1),
('Belleza', 'Productos de belleza y cuidado personal', 1);

-- ============================================
-- INSERTAR PRODUCTOS (usuario_id = 1)
-- ============================================

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Laptop HP Pavilion 15', 1, 10, 8500.00, 1),
('Mouse Logitech MX Master', 1, 25, 1200.00, 1),
('Teclado Mecanico RGB', 1, 8, 1800.00, 1),
('Monitor Samsung 24"', 1, 5, 3200.00, 1),
('Auriculares Sony WH-1000', 1, 12, 4500.00, 1),
('Disco Duro SSD 1TB', 1, 15, 1500.00, 1),
('Cargador USB-C 65W', 1, 30, 450.00, 1),
('Webcam 1080p', 1, 7, 800.00, 1),
('Tableta Grafica', 1, 2, 3500.00, 1),
('Silla Gamer', 1, 1, 4200.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Camisa Polo Hombre', 2, 20, 350.00, 1),
('Pantalon Mezclilla', 2, 15, 650.00, 1),
('Chamarra Impermeable', 2, 3, 1200.00, 1),
('Gorra Deportiva', 2, 25, 180.00, 1),
('Zapatos Deportivos', 2, 8, 1800.00, 1),
('Bufanda de Lana', 2, 12, 250.00, 1),
('Chamarra de Piel', 2, 2, 2500.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Arroz 1kg', 3, 50, 25.00, 1),
('Aceite Vegetal 1L', 3, 30, 45.00, 1),
('Leche Entera 1L', 3, 20, 28.00, 1),
('Cafe Molido 500g', 3, 15, 120.00, 1),
('Azucar 1kg', 3, 40, 22.00, 1),
('Harina de Trigo 1kg', 3, 35, 18.00, 1),
('Cafe Especialidad', 3, 3, 180.00, 1);


INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Sarten Antiadherente', 4, 10, 350.00, 1),
('Juego de Toallas', 4, 8, 280.00, 1),
('Lampara LED', 4, 4, 350.00, 1),
('Cortinas Blackout', 4, 6, 450.00, 1),
('Organizador de Escritorio', 4, 15, 150.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Pelota de Futbol', 5, 12, 280.00, 1),
('Muneca Articulada', 5, 8, 350.00, 1),
('Lego Creator', 5, 5, 1200.00, 1),
('Carro a Control Remoto', 5, 3, 650.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Balon de Basquetbol', 6, 10, 450.00, 1),
('Raqueta de Tenis', 6, 6, 800.00, 1),
('Guantes de Boxeo', 6, 8, 550.00, 1),
('Mat de Yoga', 6, 12, 350.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('JavaScript: The Good Parts', 7, 15, 450.00, 1),
('Clean Code', 7, 10, 580.00, 1),
('El Principito', 7, 20, 180.00, 1),
('Cien Anos de Soledad', 7, 12, 250.00, 1);

INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) VALUES
('Shampoo Profesional', 8, 25, 180.00, 1),
('Crema Hidratante', 8, 18, 220.00, 1),
('Perfume Importado', 8, 5, 850.00, 1),
('Set de Maquillaje', 8, 8, 450.00, 1);

-- ============================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================

SELECT * FROM usuarios;
SELECT * FROM categorias;
SELECT p.id, p.nombre, c.nombre as categoria, p.cantidad, p.precio
FROM productos p
JOIN categorias c ON p.categoria_id = c.id;

-- ============================================
-- ESTADISTICAS
-- ============================================

SELECT 
    (SELECT COUNT(*) FROM productos) as total_productos,
    (SELECT COUNT(*) FROM categorias) as total_categorias,
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM productos WHERE cantidad < 5) as productos_stock_bajo;