
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sql1',
    database: 'gameinfo'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        return;
    }

    console.log('Connected to MySQL successfully!');
});

module.exports = db;
