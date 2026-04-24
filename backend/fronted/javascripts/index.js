// variable para procutos de manera global
let productosGlobal = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Index cargado');
    
    const autenticado = await verificarSesion();
    if (!autenticado) return;
    
    await cargarNombreUsuario();
    await cargarEstadisticas();
    await cargarStockBajo();
    await cargarUltimosProductos();
    
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    configurarActualizarBtn();
    mostrarMenuAdmin();
});
// carga y muestra nombre del usuario en el index o pagina principal
async function cargarNombreUsuario() {
    const usuario = await obtenerUsuario();
    const nombreSpan = document.getElementById('nombreUsuario');
    if (nombreSpan && usuario) {
        nombreSpan.textContent = usuario.nombre || usuario.email;
    }
}
// carga y muestra total, categorias, valor total, stock bajo de los productos de los usuarios 

async function cargarEstadisticas() {
    const productos = await obtenerProductos();
    productosGlobal = productos;
    
    const total = productos.length;
    const valorTotal = productos.reduce((sum, p) => sum + ((p.cantidad||0) * parseFloat(p.precio||0)), 0);  /*parseFloat <--- importante para que acepte decimal y cadque la tabla*/
    const bajoStock = productos.filter(p => (p.cantidad||0) < 5).length;
    const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(c => c))];
    
    const totalElem = document.getElementById('totalProductos');
    const valorElem = document.getElementById('valorInventario');
    const stockElem = document.getElementById('stockBajo');
    const categoriasElem = document.getElementById('totalCategorias');
    
    if (totalElem) totalElem.textContent = total;
    if (valorElem) valorElem.textContent = `$${valorTotal.toFixed(2)}`;
    if (stockElem) stockElem.textContent = bajoStock;
    if (categoriasElem) categoriasElem.textContent = categoriasUnicas.length;
}


// muestra los productos con stock bajo
async function cargarStockBajo() {
    const container = document.getElementById('stockBajoList');
    if (!container) return;
    
    const productos = await obtenerProductos();
    const stockBajo = productos.filter(p => (p.cantidad||0) < 5);
    
    if (stockBajo.length === 0) {
        container.innerHTML = '<p>No hay productos con stock bajo</p>';
        return;
    }
    
    container.innerHTML = stockBajo.map(p => `
        <div class="alert-item">
            <strong>${escapeHtml(p.nombre)}</strong> - Stock: ${p.cantidad}
            <a href="productos.html">Reabastecer</a>
        </div>
    `).join('');
}


//muestra ultimos productos agregados al sistema
async function cargarUltimosProductos() {
    const container = document.getElementById('recentProducts');
    if (!container) {
        console.log('No se encontró recentProducts');
        return;
    }
    
    console.log('Cargando últimos productos...');
    const productos = await obtenerProductos();
    console.log('Productos obtenidos:', productos.length);
    
    if (!productos || productos.length === 0) {
        container.innerHTML = '<p>No hay productos registrados</p>';
        return;
    }
    
    const ultimos = [...productos].reverse().slice(0, 5);
    
    container.innerHTML = ultimos.map(p => `
        <div class="recent-item" style="border-left: 4px solid #27ae60; padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">
            <strong>${escapeHtml(p.nombre)}</strong><br>
             $${parseFloat(p.precio||0).toFixed(2)} |  Stock: ${p.cantidad || 0}
        </div>
    `).join('');
}


// boton de actualizar
function configurarActualizarBtn() {
    const btn = document.getElementById('actualizarStatsBtn');
    if (btn) {
        btn.addEventListener('click', async () => {
            btn.textContent = 'Actualizando...';
            await cargarEstadisticas();
            await cargarStockBajo();
            await cargarUltimosProductos();
            btn.textContent = 'Actualizar';
            alert('Estadísticas actualizadas');
        });
    }
}

//  |||||||||RUTAS DE ADMIN||||||||||||||

app.get('/admin/usuarios', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    if (req.session.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');

    const sql = 'SELECT id, nombre, email, rol FROM usuarios ORDER BY id ASC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

app.put('/admin/usuarios/:id', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    if (req.session.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');

    const { rol } = req.body;
    const sql = 'UPDATE usuarios SET rol = ? WHERE id = ?';
    db.query(sql, [rol, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send('Rol actualizado');
    });
});

app.delete('/admin/usuarios/:id', (req, res) => {
    if (!req.session.usuario) return res.status(401).send('No autorizado');
    if (req.session.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');
    if (req.params.id == req.session.usuario.id) return res.status(400).send('No puedes eliminarte a ti mismo');

    const sql = 'DELETE FROM usuarios WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send('Usuario eliminado');
    });
});