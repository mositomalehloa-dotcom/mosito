const express = require('express');
  const cors = require('cors');
  const { pool } = require('./db');
  const dotenv = require('dotenv');

  dotenv.config();
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/lecturer', require('./routes/lecturer'));
  app.use('/api/student', require('./routes/student'));
  app.use('/api/pl', require('./routes/programLeader'));


  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  module.exports = { pool };