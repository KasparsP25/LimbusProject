
const express = require('express');
const router = express.Router();

const db = require('../data/database');

router.get('/', (req, res) => {

    db.query('SELECT * FROM mainInfo', (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: 'Database query failed'
            });
        }

        res.json(results);
    });

});

module.exports = router;
