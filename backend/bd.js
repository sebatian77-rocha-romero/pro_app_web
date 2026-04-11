const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "inventario",
    port: 3306 
}); 

db.connect((err) => {
    if(err) {
        console.error('Errorde conexion: ', err)
        return;
    }
    console.log("conexion exitosa a la bse de datos")
    
});

module.exports = db;