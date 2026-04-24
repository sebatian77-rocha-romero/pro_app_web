// variables
let categoriasGlobal = [];
let editandoId = null;

// Inicializar funciones como verificas la sesion, cargar las categorias, conf de formulario, menu hamburguesa y cerrar sesion
document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await cargarCategorias();
    configurarFormulario();
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    mostrarMenuAdmin();
});

// ||||||||||CARGAR Y MOSTRAR||||||||

async function cargarCategorias() {
    categoriasGlobal = await obtenerCategorias();
    mostrarCategorias(categoriasGlobal);
}

function mostrarCategorias(categorias) {
    const tbody = document.getElementById('categoriasBody');
    if (!tbody) return;

    if (categorias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay categorías registradas</td></tr>';
        return;
    }

    tbody.innerHTML = categorias.map(c => `
        <tr>
            <td>${c.id}</td>
            <td><strong>${escapeHtml(c.nombre)}</strong></td>
            <td>${escapeHtml(c.descripcion || '-')}</td>
            <td><span>${c.total_productos || 0} producto(s)</span></td>
            <td>
                <button class="btn-editar" onclick="editarCategoria(${c.id})">Editar</button>
                <button class="btn-eliminar" onclick="borrarCategoria(${c.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ============ FORMULARIO ============

function configurarFormulario() {
    const form = document.getElementById('categoriaForm');
    const cancelBtn = document.getElementById('cancelBtn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const descripcion = document.getElementById('descripcion').value.trim();
            const categoriaId = document.getElementById('categoriaId').value;

            if (!nombre) {
                alert('❌ El nombre es requerido');
                return;
            }

            let success;

            if (categoriaId) {
                // Actualizar en backend
                success = await actualizarCategoria(categoriaId, { nombre, descripcion });
                if (success) alert('✅ Categoría actualizada');
            } else {
                // Crear en backend
                success = await crearCategoria({ nombre, descripcion });
                if (success) alert('✅ Categoría creada');
            }

            if (success) {
                limpiarFormulario();
                await cargarCategorias();
            } else {
                alert('❌ Error al guardar la categoría');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', limpiarFormulario);
    }
}

// ============ ACCIONES ============

function editarCategoria(id) {
    const categoria = categoriasGlobal.find(c => c.id === id);
    if (!categoria) return;

    editandoId = id;
    document.getElementById('categoriaId').value = categoria.id;
    document.getElementById('nombre').value = categoria.nombre;
    document.getElementById('descripcion').value = categoria.descripcion || '';

    document.getElementById('formTitle').textContent = '✏️ Editar Categoría';
    document.getElementById('submitBtn').textContent = 'Actualizar Categoría';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    // Scroll al formulario
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

async function borrarCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    const success = await eliminarCategoria(id);
    if (success) {
        alert('✅ Categoría eliminada');
        await cargarCategorias();
    } else {
        alert('❌ Error al eliminar. Puede que tenga productos asociados.');
    }
}

function limpiarFormulario() {
    editandoId = null;
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('formTitle').textContent = 'Agregar Categoría';
    document.getElementById('submitBtn').textContent = 'Crear Categoría';
    document.getElementById('cancelBtn').style.display = 'none';
}

// ============ LLAMADAS AL BACKEND ============

async function crearCategoria(categoria) {
    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoria),
            credentials: 'include'
        });
        return res.ok;
    } catch (error) {
        console.error('Error creando categoría:', error);
        return false;
    }
}

async function actualizarCategoria(id, categoria) {
    try {
        const res = await fetch(`${API_URL}/categorias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoria),
            credentials: 'include'
        });
        return res.ok;
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        return false;
    }
}

async function eliminarCategoria(id) {
    try {
        const res = await fetch(`${API_URL}/categorias/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return res.ok;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        return false;
    }
}
