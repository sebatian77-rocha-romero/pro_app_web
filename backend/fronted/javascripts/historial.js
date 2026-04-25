document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await verificarSesion();
    if (!autenticado) return;

    const usuario = await obtenerUsuario();
    const esAdmin = usuario && usuario.rol === 'admin';

    await cargarHistorial(esAdmin);
    configurarMenuHamburguesa();
    configurarLogoutGlobal();
    mostrarMenuAdmin();
});

async function cargarHistorial(esAdmin) {
    try {
        const url = esAdmin ? `${API_URL}/admin/historial` : `${API_URL}/historial`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const historial = await res.json();
        mostrarHistorial(historial);
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

function mostrarHistorial(historial) {
    const tbody = document.getElementById('historialBody');
    if (!tbody) return;

    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay movimientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = historial.map(h => {
        const fecha = new Date(h.fecha).toLocaleString('es-MX');
        const badgeClass = h.accion === 'crear' ? 'badge-admin' 
                         : h.accion === 'eliminar' ? 'badge-eliminar' 
                         : 'badge-editar';
        return `
            <tr>
                <td>${fecha}</td>
                <td>${escapeHtml(h.usuario_nombre || '-')}</td>
                <td><span class="${badgeClass}">${h.accion}</span></td>
                <td>${escapeHtml(h.producto_nombre || '-')}</td>
                <td>${escapeHtml(h.detalle || '-')}</td>
            </tr>
        `;
    }).join('');
}