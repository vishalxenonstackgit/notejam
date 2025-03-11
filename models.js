const { Pool } = require('pg');
const settings = require('../settings');
const pool = new Pool(settings);// This is the pool initialized using the `settings.js` file
const moment = require('moment');

// Users Model
const User = {
  create: async (email, password) => {
    return pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, password]
    );
  },
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
};

// Pads Model
const Pad = {
  create: async (name, user_id) => {
    return pool.query(
      'INSERT INTO pads (name, user_id) VALUES ($1, $2) RETURNING *',
      [name, user_id]
    );
  },
  findById: async (id, user_id) => {
    const result = await pool.query(
      'SELECT * FROM pads WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows[0];
  },
  deleteById: async (id) => {
    return pool.query('DELETE FROM pads WHERE id = $1', [id]);
  },
};

// Notes Model
const Note = {
  create: async (name, text, user_id, pad_id) => {
    return pool.query(
      'INSERT INTO notes (name, text, user_id, pad_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [name, text, user_id, pad_id]
    );
  },
  findById: async (id, user_id) => {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows[0];
  },
  updateById: async (id, name, text) => {
    return pool.query(
      'UPDATE notes SET name = $1, text = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, text, id]
    );
  },
  deleteById: async (id) => {
    return pool.query('DELETE FROM notes WHERE id = $1', [id]);
  },
};

// Export Models
module.exports = {
  User,
  Pad,
  Note,
  formatUpdatedAt: (date) => moment(date).fromNow(),
};
