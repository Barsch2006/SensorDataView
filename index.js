const { config } = require('dotenv');
config();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DB ?? './sqlite.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS room_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )`);
});

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// insert data from a room
app.post('/api/room/add', (req, res) => {
    const room = req.body.room;
    const value = req.body.value;
    const timestamp = req.body.time;
    if (!room || !value || !timestamp) {
        return;
    }

    db.run(`INSERT INTO room_data (name, value, timestamp) VALUES (?, ?, ?)`, [room, value, timestamp], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).redirect('/');
    });
});

app.get('/api/rooms', (req, res) => {
    db.all(`SELECT DISTINCT name FROM room_data`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).json(rows);
    });
});

// get the data of a room in a range of time
app.get('/api/room/:start/:end', (req, res) => {
    let start = req.params.start;
    let end = req.params.end;

    // if no start is given start is today 00:00:00
    if (start === 'all') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        start = start.toISOString();
    }
    // if no end is given end is today 23:59:59
    if (end === 'all') {
        end = new Date();
        end.setHours(23, 59, 59, 999);
        end = end.toISOString();
    }

    db.all(`SELECT * FROM room_data WHERE timestamp BETWEEN ? AND ?`, [start, end], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).json(rows);
    });
});

app.use(express.static('public'));

app.listen(process.env.PORT ?? 1337, () => {
    console.log(`Server running on port ${process.env.PORT ?? 1337}`)
});
