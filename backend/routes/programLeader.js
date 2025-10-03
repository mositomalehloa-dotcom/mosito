const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// GET classes for PL
router.get('/classes', auth(['pl']), async (req, res) => {
  try {
    const { faculty_name } = req.user;
    console.log(`Fetching classes for program leader with faculty: ${faculty_name}`);
    const result = await pool.query(
      `SELECT c.*, co.course_name, co.course_code, u.username AS lecturer_name,
              AVG(ra.rating) AS average_rating, COUNT(ra.id) AS rating_count
       FROM classes c
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON c.lecturer_id = u.id
       LEFT JOIN ratings ra ON c.id = ra.class_id
       WHERE u.faculty_name = $1
       GROUP BY c.id, co.course_name, co.course_code, u.username
       ORDER BY c.week_of_reporting DESC`,
      [faculty_name]
    );
    console.log(`Found ${result.rows.length} classes`);
    res.json(result.rows);
  } catch (err) {
    console.error('PL classes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET ratings for a class
router.get('/feedback/:classId', auth(['pl']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { faculty_name } = req.user;
    console.log(`Fetching feedback for class ID: ${classId}`);

    const classCheck = await pool.query(
      `SELECT c.id
       FROM classes c
       JOIN users u ON c.lecturer_id = u.id
       WHERE c.id = $1 AND u.faculty_name = $2`,
      [classId, faculty_name]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: Class not in your faculty' });
    }

    const result = await pool.query(
      'SELECT id, rating, comments, created_at FROM ratings WHERE class_id = $1 ORDER BY created_at DESC',
      [classId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('PL ratings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Search reports
router.get('/reports/search', auth(['pl']), async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });
    const sanitizedKeyword = keyword.trim().replace(/\s+/g, ' & ');
    const { faculty_name } = req.user;
    console.log(`Searching reports with keyword: ${sanitizedKeyword}`);

    const result = await pool.query(
      `SELECT r.id, r.topic_taught, r.learning_outcomes, r.date_of_lecture, 
              c.class_name, co.course_name, u.username AS lecturer_name,
              ts_rank(r.search_vector, to_tsquery('english', $1)) AS rank
       FROM reports r
       JOIN classes c ON r.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON r.lecturer_id = u.id
       WHERE r.search_vector @@ to_tsquery('english', $1)
       AND u.faculty_name = $2
       ORDER BY rank DESC`,
      [sanitizedKeyword, faculty_name]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Excel export for search
router.get('/reports/search/export', auth(['pl']), async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });
    const sanitizedKeyword = keyword.trim().replace(/\s+/g, ' & ');
    const { faculty_name } = req.user;

    const result = await pool.query(
      `SELECT r.id, r.topic_taught, r.learning_outcomes, r.date_of_lecture, 
              c.class_name, co.course_name, u.username AS lecturer_name
       FROM reports r
       JOIN classes c ON r.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON r.lecturer_id = u.id
       WHERE r.search_vector @@ to_tsquery('english', $1)
       AND u.faculty_name = $2`,
      [sanitizedKeyword, faculty_name]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Search Results');
    sheet.addRow(['ID', 'Class Name', 'Course Name', 'Lecturer', 'Date', 'Topic', 'Outcomes']);
    result.rows.forEach(row => sheet.addRow([
      row.id, row.class_name, row.course_name, row.lecturer_name, row.date_of_lecture, row.topic_taught, row.learning_outcomes
    ]));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=search_results.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export' });
  }
});

module.exports = router;