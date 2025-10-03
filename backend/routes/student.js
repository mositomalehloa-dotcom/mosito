const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

console.log('Loading student.js - Success!');

// Simple test route
router.get('/test', auth(['student']), (req, res) => {
  res.json({ message: 'Student route working', userId: req.user.id });
});

module.exports = router;