let productosGlobal = [];
let categoriasGlobal = [];
let editandoId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await verificarSesion();
    if (!autenticado) return;

    await cargarCategoriasEnSelect();
    await cargarProductos();
    configurarFormulario();
    configurarBusqueda();
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    mostrarToastStockBajo();
    mostrarMenuAdmin();
});

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

async function cargarProductos() {
    productosGlobal = await obtenerProductos();
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
                if (success) {
                    await registrarHistorial('editar', producto.nombre,
                        `Cantidad: ${producto.cantidad} | Precio: $${producto.precio}`);
                    alert('Producto actualizado');
                }
            } else {
                success = await crearProducto(producto);
                if (success) {
                    await registrarHistorial('crear', producto.nombre,
                        `Cantidad: ${producto.cantidad} | Precio: $${producto.precio}`);
                    alert('Producto creado');
                }
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

async function editarProducto(id) {
    const producto = productosGlobal.find(p => p.id === id);
    if (!producto) return;
    document.getElementById('productoId').value = producto.id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('categoria').value = producto.categoria_id || '';
    document.getElementById('cantidad').value = producto.cantidad;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('submitBtn').textContent = 'Actualizar Producto';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

async function borrarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const producto = productosGlobal.find(p => p.id === id);
    const success = await eliminarProducto(id);
    if (success) {
        await registrarHistorial('eliminar', producto?.nombre || 'Producto', `ID: ${id}`);
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

function exportarExcel() {
    if (!productosGlobal || productosGlobal.length === 0) {
        alert('No hay productos para exportar');
        return;
    }
    const datos = productosGlobal.map(p => ({
        ID: p.id,
        Nombre: p.nombre,
        Categoría: p.categoria || '-',
        Cantidad: p.cantidad || 0,
        Precio: parseFloat(p.precio || 0).toFixed(2),
        Estado: (p.cantidad || 0) < 5 ? 'Stock bajo' : 'Normal'
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'inventario_productos.xlsx');
}

function exportarPDF() {
    if (!productosGlobal || productosGlobal.length === 0) {
        alert('No hay productos para exportar');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Inventario de Productos', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 28);
    const columnas = ['ID', 'Nombre', 'Categoría', 'Cantidad', 'Precio', 'Estado'];
    const filas = productosGlobal.map(p => [
        p.id,
        p.nombre,
        p.categoria || '-',
        p.cantidad || 0,
        `$${parseFloat(p.precio || 0).toFixed(2)}`,
        (p.cantidad || 0) < 5 ? 'Stock bajo' : 'Normal'
    ]);
    doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 35,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [31, 111, 194] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save('inventario_productos.pdf');
}