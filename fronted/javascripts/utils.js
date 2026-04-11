const API_URL = 'http://localhost:3000';

// ============ SESIÓN ============
async function verificarSesion() {
    try {
        const res = await fetch(`${API_URL}/perfil`, { 
            credentials: 'include' 
        });
        
        console.log('Verificando sesión - Status:', res.status);
        
        if (res.status === 401) {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
            return false;
        }
        
        if (res.ok) {
            console.log('Sesión válida');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
}

async function cerrarSesion() {
    await fetch(`${API_URL}/logout`, { 
        credentials: 'include' 
    });
    window.location.href = 'login.html';
}

async function obtenerUsuario() {
    const res = await fetch(`${API_URL}/perfil`, { 
        credentials: 'include' 
    });
    return res.ok ? await res.json() : null;
}

// ============ PRODUCTOS ============
async function obtenerProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`, { 
            credentials: 'include' 
        });
        if (res.ok) {
            const data = await res.json();
            console.log('Productos cargados:', data.length);
            return data;
        } else {
            console.error('Error obtenerProductos:', res.status);
            return [];
        }
    } catch (error) {
        console.error('Error obtenerProductos:', error);
        return [];
    }
}

async function crearProducto(producto) {
    const res = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto),
        credentials: 'include'
    });
    return res.ok;
}

async function actualizarProducto(id, producto) {
    const res = await fetch(`${API_URL}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto),
        credentials: 'include'
    });
    return res.ok;
}

async function eliminarProducto(id) {
    const res = await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    return res.ok;
}

// ============ CATEGORÍAS ============
async function obtenerCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`, { 
            credentials: 'include' 
        });
        if (res.ok) {
            return await res.json();
        }
        return [];
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        return [];
    }
}

//funciones de menu, cerrar sesion
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============ CONFIGURAR MENÚ HAMBURGUESA ============
function configurarMenuHamburguesa() {
    const burguer = document.getElementById('burguer');
    const navMenu = document.getElementById('nav-menu');
    
    if (burguer && navMenu) {
        // Remover event listeners anteriores
        const newBurguer = burguer.cloneNode(true);
        burguer.parentNode.replaceChild(newBurguer, burguer);
        
        newBurguer.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// ============ CONFIGURAR CIERRE DE SESIÓN ============
function configurarLogoutGlobal() {
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await cerrarSesion();
        });
    }
}