const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',  // adjust if different
    user: 'root',       // your MySQL username
    password: 'Mysql@123',       // your MySQL password (leave blank if none)
    database: 'image_upload_db'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Set up storage engine for images using multer
const storage = multer.diskStorage({
    destination: './uploads',  // directory to save uploaded files
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // use timestamp for unique filenames
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // limit image size to 1MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
}).single('image');

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.send('Error: ' + err);
        } else {
            const { name, email } = req.body;
            const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

            const sql = 'INSERT INTO users (name, email, image_path) VALUES (?, ?, ?)';
            db.query(sql, [name, email, imagePath], (err, result) => {
                if (err) throw err;
                res.redirect('/users');
            });
        }
    });
});

app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) throw err;

        let html = '<h1>User Data</h1><ul>';
        results.forEach((user) => {
            html += `<li>Name: ${user.name}, Email: ${user.email}, 
            <img src="${user.image_path}" width="100"></li>`;
        });
        html += '</ul>';
        res.send(html);
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
