const bcrypt = require('bcrypt');

async function generarHash() {
    const hash = await bcrypt.hash('admin12345', 10);
    console.log('=================================');
    console.log('Contraseña: admin12345');
    console.log('Hash REAL:');
    console.log(hash);
    console.log('=================================');
}

generarHash();