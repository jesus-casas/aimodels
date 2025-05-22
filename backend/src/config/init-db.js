const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function initializeDatabase() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    // Execute the SQL commands
    await query(sql);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase;