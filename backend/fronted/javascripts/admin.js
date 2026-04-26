document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await verificarSesion();
    if (!autenticado) return;

    // Verificar que sea admin
    const usuario = await obtenerUsuario();
    if (!usuario || usuario.rol !== 'admin') {
        alert('Acceso denegado — solo administradores');
        window.location.href = 'index.html';
        return;
    }

    await cargarUsuarios();
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    mostrarMenuAdmin();
});

async function cargarUsuarios() {
    try {
        const res = await fetch(`${API_URL}/admin/usuarios`, {
            credentials: 'include'
        });
        if (!res.ok) {
            window.location.href = 'index.html';
            return;
        }
        const usuarios = await res.json();
        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosBody');
    if (!tbody) return;

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = usuarios.map((u, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(u.nombre)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>
                <span class="${u.rol === 'admin' ? 'badge-admin' : 'badge-usuario'}">
                    ${u.rol}
                </span>
            </td>
            <td>
                <button class="btn-editar" onclick="cambiarRol(${u.id}, '${u.rol}')">
                    Cambiar Rol
                </button>
                <button class="btn-eliminar" onclick="eliminarUsuario(${u.id}, '${escapeHtml(u.nombre)}')">
                    Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

async function cambiarRol(id, rolActual) {
    const nuevoRol = rolActual === 'admin' ? 'usuario' : 'admin';
    if (!confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;

    const res = await fetch(`${API_URL}/admin/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol }),
        credentials: 'include'
    });

    if (res.ok) {
        alert(`Rol actualizado a ${nuevoRol}`);
        await cargarUsuarios();
    } else {
        alert('Error al cambiar rol');
    }
}

async function eliminarUsuario(id, nombre) {
    if (!confirm(`¿Eliminar al usuario ${nombre}? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`${API_URL}/admin/usuarios/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (res.ok) {
        alert('Usuario eliminado');
        await cargarUsuarios();
    } else {
        const error = await res.text();
        alert(`Error: ${error}`);
    }
}