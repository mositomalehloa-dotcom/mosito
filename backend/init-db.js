console.log('Starting init-db.js at:', __filename);

const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        faculty_name VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_name VARCHAR(100) NOT NULL,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        assigned_lecturer_id INTEGER REFERENCES users(id),
        stream VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(100),
        course_id INTEGER REFERENCES courses(id),
        venue VARCHAR(100),
        scheduled_time TIME,
        week INTEGER,
        date DATE,
        topic_taught TEXT,
        learning_outcomes TEXT,
        recommendations TEXT,
        actual_students INTEGER,
        total_registered_students INTEGER,
        lecturer_id INTEGER REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id),
        feedback TEXT
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comments TEXT
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
};

createTables();