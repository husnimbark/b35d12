const { Pool } = require('pg');

const dbPool = new Pool({
  database: 'b35_personal_web',
  port: '5000',
  user: 'postgres',
  password: 'dropdead',
});

module.exports = dbPool;
