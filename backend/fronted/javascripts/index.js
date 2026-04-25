// variable para productos de manera global
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

async function cargarNombreUsuario() {
    const usuario = await obtenerUsuario();
    const nombreSpan = document.getElementById('nombreUsuario');
    if (nombreSpan && usuario) {
        nombreSpan.textContent = usuario.nombre || usuario.email;
    }
}

async function cargarEstadisticas() {
    const productos = await obtenerProductos();
    productosGlobal = productos;
    
    const total = productos.length;
    const valorTotal = productos.reduce((sum, p) => sum + ((p.cantidad||0) * parseFloat(p.precio||0)), 0);
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

async function cargarUltimosProductos() {
    const container = document.getElementById('recentProducts');
    if (!container) return;
    
    const productos = await obtenerProductos();
    
    if (!productos || productos.length === 0) {
        container.innerHTML = '<p>No hay productos registrados</p>';
        return;
    }
    
    const ultimos = [...productos].reverse().slice(0, 5);
    
    container.innerHTML = ultimos.map(p => `
        <div class="recent-item">
            <strong>${escapeHtml(p.nombre)}</strong><br>
            $${parseFloat(p.precio||0).toFixed(2)} | Stock: ${p.cantidad || 0}
        </div>
    `).join('');
}

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

