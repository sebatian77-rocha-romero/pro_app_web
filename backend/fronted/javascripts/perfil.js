//funciones globales y funciones locales
document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await verificarSesion();
    if (!autenticado) return;
    
    await cargarPerfil(); // local
    configurarMenuHamburguesa(); // global
    configurarLogoutGlobal(); // global
    configurarBotonDesplegable(); // local
    configurarCambioPassword(); // local
    mostrarMenuAdmin(); // global
});

//carga el perfil en la pagina con sus datos
async function cargarPerfil() {
    const usuario = await obtenerUsuario();
    
    if (usuario) {
        const nombreSpan = document.getElementById('perfilNombre'); // nombre del usuario
        const emailSpan = document.getElementById('perfilEmail'); // email   del usuario
        const rolSpan = document.getElementById('perfilRol'); // rol del usuario
        const idSpan = document.getElementById('perfilId'); // id del usuario
        const fechaSpan = document.getElementById('fechaRegistro'); // fecha de registro del usuario
        
        if (nombreSpan) nombreSpan.textContent = usuario.nombre || '-';
        if (emailSpan) emailSpan.textContent = usuario.email || '-';
        if (rolSpan) rolSpan.textContent = usuario.rol || 'usuario';
        if (idSpan) idSpan.textContent = usuario.id || '-';
        
        //mostrar fecha actual si no hay fecha de registro del usuario
        if (fechaSpan) {
            const fecha = new Date().toLocaleDateString('es-MX');
            fechaSpan.textContent = fecha;
        }
    }
}


//boton paa desplegar fotmulario de cambio de sesion
function configurarBotonDesplegable() {
    const btn = document.getElementById('botondeplegable');
    const formContainer = document.querySelector('.actualizar');
    
    if (btn && formContainer) {
        btn.addEventListener('click', () => {
            formContainer.classList.toggle('active');
            
            if (formContainer.classList.contains('active')) {
                btn.textContent = 'Cancelar';
            } else {
                btn.textContent = 'Cambiar contraseña';
            }
        });
    }
}


//cambia la password 
function configurarCambioPassword() {
    const form = document.getElementById('cont-actualizar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevaPassword = document.getElementById('contraseña').value;
        const confirmacion = document.getElementById('confirmacion').value;
        const message = document.getElementById('passwordMessage');

        if (nuevaPassword !== confirmacion) {
            message.textContent = 'Las contraseñas no coinciden';
            message.style.color = 'red';
            return;
        }

        if (nuevaPassword.length < 6) {
            message.textContent = 'La contraseña debe tener al menos 6 caracteres';
            message.style.color = 'red';
            return;
        }

        // llamada al backend
        try {
            const res = await fetch(`${API_URL}/cambiar-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: nuevaPassword }),
                credentials: 'include'
            });

            if (res.ok) {
                message.textContent = 'Contraseña actualizada correctamente';
                message.style.color = 'green';
                form.reset();
                setTimeout(() => {
                    document.getElementById('botondeplegable').click();
                    message.textContent = '';
                }, 2000);
            } else {
                const error = await res.text();
                message.textContent = `Error: ${error}`;
                message.style.color = 'red';
            }
        } catch (error) {
            message.textContent = 'Error de conexión con el servidor';
            message.style.color = 'red';
        }
    });
}