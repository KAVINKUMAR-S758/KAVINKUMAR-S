const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const db = require('./database');
const auth = require('./auth');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// View engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Add this before your other routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auth', auth);

// Home route
app.get('/', (req, res) => {
    if (req.cookies.userId) {
        res.redirect('/profile');
    } else {
        res.redirect('/auth/login');
    }
});

// File upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    
    const userId = req.cookies.userId;
    const { filename, originalname } = req.file;
    
    db.run(
        'INSERT INTO files (user_id, filename, originalname) VALUES (?, ?, ?)',
        [userId, filename, originalname],
        (err) => {
            if (err) return console.error(err);
            res.redirect('/gallery');
        }
    );
});

// Gallery
app.get('/gallery', (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    
    const userId = req.cookies.userId;
    db.all(
        'SELECT * FROM files WHERE user_id = ?',
        [userId],
        (err, files) => {
            if (err) return console.error(err);
            res.render('gallery', { files });
        }
    );
});

// Create post
app.post('/posts', (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    
    const userId = req.cookies.userId;
    const { content } = req.body;
    
    db.run(
        'INSERT INTO posts (user_id, content) VALUES (?, ?)',
        [userId, content],
        (err) => {
            if (err) return console.error(err);
            res.redirect('/profile');
        }
    );
});

// Profile route (moved from auth.js)
app.get('/profile', (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    
    const userId = req.cookies.userId;
    db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (err, user) => {
            if (err || !user) return res.redirect('/auth/login');
            
            db.all(
                'SELECT * FROM posts WHERE user_id = ?',
                [userId],
                (err, posts) => {
                    if (err) posts = [];
                    res.render('profile', { user, posts });
                }
            );
        }
    );
});

// Delete image route
app.delete('/delete-image/:id', (req, res) => {
    if (!req.cookies.userId) return res.status(401).json({ success: false });
    
    const fileId = req.params.id;
    const userId = req.cookies.userId;
    
    // First verify the image belongs to the user
    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId],
        (err, file) => {
            if (err || !file) {
                return res.status(404).json({ success: false });
            }
            
            // Delete from database
            db.run(
                'DELETE FROM files WHERE id = ?',
                [fileId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ success: false });
                    }
                    
                    // Delete file from filesystem
                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.join(__dirname, 'uploads', file.filename);
                    
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting file:', err);
                        }
                        res.json({ success: true });
                    });
                }
            );
        }
    );
});
// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});