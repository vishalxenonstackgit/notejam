const async = require('async');
const { Pool } = require('pg');
const settings = require('./settings');

const pool = new Pool(settings);

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('Database connection error:', err));

module.exports = pool;

const functions = {
  createTables: function (next) {
    async.series({
      createUsers: function (callback) {
        pool.query(
          `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(75) NOT NULL,
            password VARCHAR(128) NOT NULL
          );`,
          [],
          (err) => {
            callback(err);
          }
        );
      },
      createPads: function (callback) {
        pool.query(
          `CREATE TABLE IF NOT EXISTS pads (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id)
          );`,
          [],
          (err) => {
            callback(err);
          }
        );
      },
      createNotes: function (callback) {
        pool.query(
          `CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            pad_id INTEGER REFERENCES pads(id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(100) NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT current_timestamp,
            updated_at TIMESTAMPTZ DEFAULT current_timestamp
          );`,
          [],
          (err) => {
            callback(err);
          }
        );
      }
    },
    function (err) {
      next(err);
    });
  },

  applyFixtures: function (next) {
    this.truncateTables(() => {
      async.series([
        function (callback) {
          pool.query(
            `INSERT INTO users (id, email, password) VALUES
            (1, 'user1@example.com', '$2a$10$mhkqpUvPPs.zoRSTiGAEKODOJMljkOY96zludIIw.Pop1UvQCTx8u');`,
            [],
            (err) => {
              callback(err);
            }
          );
        },
        function (callback) {
          pool.query(
            `INSERT INTO users (id, email, password) VALUES
            (2, 'user2@example.com', '$2a$10$mhkqpUvPPs.zoRSTiGAEKODOJMljkOY96zludIIw.Pop1UvQCTx8u');`,
            [],
            (err) => {
              callback(err);
            }
          );
        },
        function (callback) {
          pool.query(
            `INSERT INTO pads (id, name, user_id) VALUES
            (1, 'Pad 1', 1);`,
            [],
            (err) => {
              callback(err);
            }
          );
        },
        function (callback) {
          pool.query(
            `INSERT INTO pads (id, name, user_id) VALUES
            (2, 'Pad 2', 1);`,
            [],
            (err) => {
              callback(err);
            }
          );
        },
        function (callback) {
          pool.query(
            `INSERT INTO notes (id, pad_id, user_id, name, text) VALUES
            (1, 1, 1, 'Note 1', 'Text');`,
            [],
            (err) => {
              callback(err);
            }
          );
        },
        function (callback) {
          pool.query(
            `INSERT INTO notes (id, pad_id, user_id, name, text) VALUES
            (2, 1, 1, 'Note 2', 'Text');`,
            [],
            (err) => {
              callback(err);
            }
          );
        }
      ],
      (err) => {
        next(err);
      });
    });
  },

  truncateTables: function (next) {
    async.series([
      function (callback) {
        pool.query('DELETE FROM users;', [], (err) => {
          callback(err);
        });
      },
      function (callback) {
        pool.query('DELETE FROM notes;', [], (err) => {
          callback(err);
        });
      },
      function (callback) {
        pool.query('DELETE FROM pads;', [], (err) => {
          callback(err);
        });
      }
    ],
    (err) => {
      next(err);
    });
  }
};

if (require.main === module) {
  functions.createTables(() => {
    console.log('DB successfully initialized');
  });
}

module.exports = functions;
