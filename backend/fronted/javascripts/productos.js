let productosGlobal = [];
let categoriasGlobal = [];
let editandoId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Productos página cargada');

    const autenticado = await verificarSesion();
    if (!autenticado) return;

    await cargarCategoriasEnSelect();
    await cargarProductos();
    configurarFormulario();
    configurarBusqueda();
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    mostrarToastStockBajo();
});

// ||||||||||||||||| CATEGORÍAS EN SELECT |||||||||||||||||

async function cargarCategoriasEnSelect() {
    const select = document.getElementById('categoria');
    if (!select) return;

    categoriasGlobal = await obtenerCategorias();
    select.innerHTML = '<option value="">Seleccionar categoría...</option>';
    categoriasGlobal.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${escapeHtml(cat.nombre)}</option>`;
    });
}

function mostrarToastStockBajo() {
    const stockBajo = productosGlobal.filter(p => (p.cantidad || 0) < 5);
    if (stockBajo.length === 0) return;

    const toastBody = document.getElementById('toastBody');
    if (toastBody) {
        toastBody.innerHTML = stockBajo.map(p => `
            <div class="toast-item">
                <strong>${escapeHtml(p.nombre)}</strong> — Stock: ${p.cantidad}
            </div>
        `).join('');
    }

    setTimeout(() => {
        const toast = document.getElementById('toastStockBajo');
        if (toast) toast.classList.add('show');
    }, 1000);

    setTimeout(() => cerrarToast(), 6000);
}

function cerrarToast() {
    const toast = document.getElementById('toastStockBajo');
    if (toast) toast.classList.remove('show');
}

// |||||||||||||| CARGAR Y MOSTRAR PRODUCTOS |||||||||||||||||

async function cargarProductos() {
    console.log('Cargando productos...');
    productosGlobal = await obtenerProductos();
    console.log('Productos recibidos:', productosGlobal);
    mostrarProductos(productosGlobal);
}

function mostrarProductos(productos) {
    const tbody = document.getElementById('productosBody');
    if (!tbody) return;

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay productos registrados. ¡Crea uno!</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(p => {
        const estado = (p.cantidad || 0) < 5
            ? '<span style="color:#e74c3c; font-weight:bold;">Stock bajo</span>'
            : '<span style="color:#27ae60; font-weight:bold;">✓ Normal</span>';

        return `
            <tr>
                <td>${p.id}</td>
                <td><strong>${escapeHtml(p.nombre)}</strong></td>
                <td>${escapeHtml(p.categoria || '-')}</td>
                <td>${p.cantidad || 0}</td>
                <td>$${parseFloat(p.precio || 0).toFixed(2)}</td>
                <td>${estado}</td>
                <td>
                    <button class="btn-editar" onclick="editarProducto(${p.id})">Editar</button>
                    <button class="btn-eliminar" onclick="borrarProducto(${p.id})">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');
}

// |||||||||||| FORMULARIO ||||||||||||||

function configurarFormulario() {
    const form = document.getElementById('productoForm');
    const cancelBtn = document.getElementById('cancelBtn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const producto = {
                nombre: document.getElementById('nombre').value.trim(),
                categoria_id: document.getElementById('categoria').value || null,
                cantidad: parseInt(document.getElementById('cantidad').value) || 0,
                precio: parseFloat(document.getElementById('precio').value) || 0
            };

            if (!producto.nombre) {
                alert('El nombre del producto es requerido');
                return;
            }

            const productoId = document.getElementById('productoId').value;
            let success;

            if (productoId) {
                success = await actualizarProducto(productoId, producto);
                if (success) alert('Producto actualizado');
            } else {
                success = await crearProducto(producto);
                if (success) alert('Producto creado');
            }

            if (success) {
                limpiarFormulario();
                await cargarProductos();
                await cargarCategoriasEnSelect();
            } else {
                alert('Error al guardar');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', limpiarFormulario);
    }
}

// ||||||||||||||||| ACCIONES ||||||||||||||||||

async function editarProducto(id) {
    const producto = productosGlobal.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('productoId').value = producto.id;
    document.getElementById('nombre').value = producto.nombre;
    //aeleccionar la categoría por categoria_id
    document.getElementById('categoria').value = producto.categoria_id || '';
    document.getElementById('cantidad').value = producto.cantidad;
    document.getElementById('precio').value = producto.precio;

    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('submitBtn').textContent = 'Actualizar Producto';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    //scroll al formulario
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

async function borrarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const success = await eliminarProducto(id);
    if (success) {
        alert('Producto eliminado');
        await cargarProductos();
    } else {
        alert('Error al eliminar');
    }
}

function limpiarFormulario() {
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    document.getElementById('formTitle').textContent = 'Agregar Producto';
    document.getElementById('submitBtn').textContent = 'Crear Producto';
    document.getElementById('cancelBtn').style.display = 'none';
    editandoId = null;
}

// ============ BÚSQUEDA DE PRODUCTOS CON EL INPUT ============

function configurarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    const searchCategoria = document.getElementById('searchCategoria');

    const filtrar = () => {
        const termNombre = searchInput ? searchInput.value.toLowerCase() : '';
        const termCategoria = searchCategoria ? searchCategoria.value.toLowerCase() : '';

        const filtrados = productosGlobal.filter(p =>
            p.nombre.toLowerCase().includes(termNombre) &&
            (p.categoria || '').toLowerCase().includes(termCategoria)
        );
        mostrarProductos(filtrados);
    };

    if (searchInput) searchInput.addEventListener('input', filtrar);
    if (searchCategoria) searchCategoria.addEventListener('input', filtrar);
}
