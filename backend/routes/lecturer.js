const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET classes for lecturer
router.get('/classes', auth(['lecturer']), async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT c.*, co.course_name, co.course_code 
       FROM classes c 
       JOIN courses co ON c.course_id = co.id 
       WHERE c.lecturer_id = $1 
       ORDER BY c.week_of_reporting DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Lecturer classes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST report (data entry form)
router.post('/reports', auth(['lecturer']), async (req, res) => {
  const { class_id, date_of_lecture, topic_taught, learning_outcomes, recommendations, actual_students_present } = req.body;
  const lecturer_id = req.user.id;

  if (!class_id || !date_of_lecture || !topic_taught || !learning_outcomes || !actual_students_present) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Fetch total_registered_students from courses
    const classInfo = await pool.query('SELECT course_id FROM classes WHERE id = $1 AND lecturer_id = $2', [class_id, lecturer_id]);
    if (classInfo.rows.length === 0) {
      return res.status(403).json({ error: 'Class not found or not assigned to you' });
    }
    const course = await pool.query('SELECT total_registered_students FROM courses WHERE id = $1', [classInfo.rows[0].course_id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const result = await pool.query(
      `INSERT INTO reports (class_id, date_of_lecture, actual_students_present, topic_taught, learning_outcomes, recommendations, lecturer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [class_id, date_of_lecture, actual_students_present, topic_taught, learning_outcomes, recommendations || null, lecturer_id]
    );
    res.status(201).json({
      id: result.rows[0].id,
      message: 'Report submitted successfully',
      total_registered_students: course.rows[0].total_registered_students
    });
  } catch (err) {
    console.error('Report insertion error:', err.message);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// GET reports for lecturer
router.get('/reports', auth(['lecturer']), async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT r.*, c.class_name, co.course_name 
       FROM reports r 
       JOIN classes c ON r.class_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE r.lecturer_id = $1 
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Lecturer reports error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Search reports (extra credit)
router.get('/reports/search', auth(['lecturer']), async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });
    const sanitizedKeyword = keyword.trim().replace(/\s+/g, ' & ');
    const { id } = req.user;

    const result = await pool.query(
      `SELECT r.id, r.topic_taught, r.learning_outcomes, r.date_of_lecture, 
              c.class_name, co.course_name,
              ts_rank(r.search_vector, to_tsquery('english', $1)) AS rank
       FROM reports r
       JOIN classes c ON r.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       WHERE r.search_vector @@ to_tsquery('english', $1)
       AND r.lecturer_id = $2
       ORDER BY rank DESC`,
      [sanitizedKeyword, id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;