const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: 'luct_user',
  password: 'luct123',
  host: 'localhost',
  port: 5432,
  database: 'luct_db'
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('DB Connection Error:', err);
  } else {
    console.log('DB Connected Successfully');
    client.query('SELECT NOW()', (queryErr, res) => {
      release();
      if (queryErr) {
        console.error('Query Error:', queryErr);
      } else {
        console.log('Query Result:', res.rows[0]);
      }
    });
  }
});

module.exports = { pool };