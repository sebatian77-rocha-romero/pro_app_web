const express = require("express");
const db = require("./bd");
const cors = require("cors");
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require("path");

const app = express();

// Configuración CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173', 'http://127.0.0.1:5501', 'http://localhost:5501'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Configuración de sesiones
app.use(session({
    secret: 'mi_secreto_super_seguro_2025',
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax'
    }
}));

// Servir archivos estáticos del frontend  
app.use(express.static(path.join(__dirname, '../fronted')));

// ============ RUTAS DE USUARIOS ============

app.post('/usuarios', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).send('Faltan campos requeridos');
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        
        db.query(sql, [nombre, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send('El email ya está registrado');
                }
                return res.status(500).send(err.message);
            }
            res.status(201).send('Usuario creado exitosamente');
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('=== INTENTO DE LOGIN ===');
    console.log('Email:', email);
    
    if (!email || !password) {
        return res.status(400).send('Email y contraseña son requeridos');
    }
    
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        
        if (results.length === 0) {
            return res.status(401).send('Usuario no encontrado');
        }
        
        const usuario = results[0];
        const match = await bcrypt.compare(password, usuario.password);
        
        if (match) {
            req.session.usuario = {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol || 'usuario'
            };
            
            req.session.save((err) => {
                if (err) {
                    console.error('Error guardando sesión:', err);
                    return res.status(500).send('Error al guardar sesión');
                }
                console.log('✅ Sesión guardada:', req.session.usuario);
                res.send('Login exitoso');
            });
        } else {
            res.status(401).send('Contraseña incorrecta');
        }
    });
});

app.get('/perfil', (req, res) => {
    console.log('=== VERIFICANDO PERFIL ===');
    console.log('Session ID:', req.session.id);
    console.log('Usuario en sesión:', req.session.usuario);
    
    if (!req.session.usuario) {
        return res.status(401).send('No autorizado');
    }
    res.json(req.session.usuario);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.send('Sesión cerrada');
    });
});

app.post('/cambiar-password', async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send('No autorizado');
    }
    
    const { password } = req.body;
    
    if (!password || password.length < 6) {
        return res.status(400).send('La contraseña debe tener al menos 6 caracteres');
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';
        
        db.query(sql, [hashedPassword, req.session.usuario.id], (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.send('Contraseña actualizada');
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ============ RUTAS DE PRODUCTOS ============

app.get('/productos', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    
    
    const sql = `SELECT p.*, c.nombre as categoria FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.usuario_id = ? ORDER BY p.id ASC`;
    
    db.query(sql, [req.session.usuario.id], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

app.post('/productos', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');

    const { nombre, categoria_id, cantidad, precio } = req.body;

    if (!nombre) return res.status(400).send('El nombre del producto es requerido');

    const sql = `INSERT INTO productos (nombre, categoria_id, cantidad, precio, usuario_id) 
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [nombre, categoria_id || null, cantidad || 0, precio || 0, req.session.usuario.id],
        (err, result) => {
            if (err) return res.status(500).send(err.message);
            res.status(201).json({ id: result.insertId, message: 'Producto creado' });
        }
    );
});

app.put('/productos/:id', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send('No autorizado');
    }
    
    const { id } = req.params;
    const { nombre, categoria_id, cantidad, precio } = req.body;    
    
    const sql = `UPDATE productos SET nombre = ?, categoria = ?, cantidad = ?, precio = ? WHERE id = ? AND usuario_id = ?`;
    
    db.query(sql, [nombre, categoria, cantidad, precio, id, req.session.usuario.id], 
        (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Producto no encontrado');
            }
            res.send('Producto actualizado');
        }
    );
});

app.delete('/productos/:id', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send('No autorizado');
    }
    
    const { id } = req.params;
    const sql = 'DELETE FROM productos WHERE id = ? AND usuario_id = ?';
    
    db.query(sql, [id, req.session.usuario.id], (err, result) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado');
        }
        res.send('Producto eliminado');
    });
});

// ============ RUTAS DE CATEGORÍAS ============

app.get('/categorias', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    
    const sql = `
        SELECT c.*, COUNT(p.id) as total_productos 
        FROM categorias c
        LEFT JOIN productos p ON p.categoria_id = c.id AND p.usuario_id = c.usuario_id
        WHERE c.usuario_id = ? 
        GROUP BY c.id
        ORDER BY c.id ASC`;

    db.query(sql, [req.session.usuario.id], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

app.post('/categorias', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).send('El nombre es requerido');

    // ✅ INSERT a tabla categorias, no productos
    const sql = 'INSERT INTO categorias (nombre, descripcion, usuario_id) VALUES (?, ?, ?)';

    db.query(sql, [nombre, descripcion || null, req.session.usuario.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.status(201).json({ id: result.insertId, nombre, descripcion });
    });
});

app.put('/categorias/:id', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    // ✅ Solo nombre y descripcion, no campos de productos
    const { nombre, descripcion } = req.body;
    const sql = 'UPDATE categorias SET nombre=?, descripcion=? WHERE id=? AND usuario_id=?';
    db.query(sql, [nombre, descripcion, req.params.id, req.session.usuario.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send('No encontrada');
        res.send('Categoría actualizada');
    });
});

app.delete('/categorias/:id', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    const sql = 'DELETE FROM categorias WHERE id=? AND usuario_id=?';
    db.query(sql, [req.params.id, req.session.usuario.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send('No encontrada');
        res.send('Categoría eliminada');
    });
});

// ============ RUTA PARA MANEJAR TODAS LAS DEMÁS PETICIONES ============
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../fronted', 'registro.html'));
});

// ============ INICIAR SERVIDOR ============

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});