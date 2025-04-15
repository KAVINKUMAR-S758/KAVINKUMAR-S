const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./database');
const router = express.Router();

// Login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, user) => {
            if (err || !user) return res.render('login', { error: 'Invalid credentials' });
            
            if (password === user.password) {
                res.cookie('userId', user.id);
                res.redirect('/profile');
            } else {
                res.render('login', { error: 'Invalid credentials' });
            }
        }
    );
});

// Registration
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Check if user exists
    db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, user) => {
            if (err) return res.render('register', { error: 'Database error' });
            if (user) return res.render('register', { error: 'Username or email already exists' });
            
            db.run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, password],
                (err) => {
                    if (err) return res.render('register', { error: 'Registration failed' });
                    res.redirect('/auth/login');
                }
            );
        }
    );
});

// Change password
router.get('/change-password', (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    res.render('change-password', { error: null, success: null });
});

router.post('/change-password', (req, res) => {
    if (!req.cookies.userId) return res.redirect('/auth/login');
    
    const userId = req.cookies.userId;
    const { newPassword } = req.body;
    
    db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, userId],
        (err) => {
            if (err) return res.render('change-password', { error: 'Password change failed', success: null });
            res.render('change-password', { error: null, success: 'Password changed successfully' });
        }
    );
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('userId');
    res.redirect('/auth/login');
});

module.exports = router;