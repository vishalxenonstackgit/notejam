const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const async = require('async');
const helpers = require('../helpers');
const settings = require('../settings');

const pool = new Pool(settings);

// All notes (main page)
router.get('/', helpers.loginRequired, async (req, res) => {
  try {
    const order = req.query.order || 'updated_at DESC';
    const result = await pool.query(
      `SELECT * FROM notes WHERE user_id = $1 ORDER BY ${order}`,
      [req.user.id]
    );
    const notes = result.rows;

    // Use Promise.all to process all notes concurrently
    const processedNotes = await Promise.all(
      notes.map(async (note) => {
        const padResult = await pool.query(
          'SELECT * FROM pads WHERE id = $1',
          [note.pad_id]
        );
        note.pad = padResult.rows[0]; // Attach the pad data to the note
        return note; // Return the enriched note
      })
    );

    // Render the template with the processed notes
    res.render('notes/list', {
      title: `All notes (${processedNotes.length})`,
      notes: processedNotes,
    });
  } catch (err) {
    console.error('Error fetching notes:', err); // Log the error for debugging
    res.status(500).send('Error fetching notes');
  }
});


// Create new note
router.get('/notes/create', helpers.loginRequired, (req, res) => {
  res.render('notes/create', { padId: req.query.pad });
});

router.post('/notes/create', helpers.loginRequired, async (req, res) => {
  const data = req.body;
  data.user_id = req.user.id;
  console.log(data)

  try {
    await pool.query(
      'INSERT INTO notes (name, text, user_id, pad_id) VALUES ($1, $2, $3, $4)',
      [data.name, data.text, data.user_id, data.pad_id]
    );
    req.flash('success', 'Note is successfully created');
    res.redirect('/');
  } catch (err) {
    res.locals.errors = helpers.formatModelErrors(err);
    res.render('notes/create');
  }
});

// Inject note in request
router.use('/notes/:id', async (req, res, next) => {
  if (req.user) {
    try {
      const result = await pool.query(
        'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) {
        res.status(404).send('Note not found');
        return;
      }
      req.note = result.rows[0];
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// View note
router.get('/notes/:id', helpers.loginRequired, (req, res) => {
  res.render('notes/view', { note: req.note });
});

// Edit note
router.get('/notes/:id/edit', helpers.loginRequired, (req, res) => {
  res.render('notes/edit', { note: req.note });
});

router.post('/notes/:id/edit', helpers.loginRequired, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notes SET name = $1, text = $2 WHERE id = $3',
      [req.body.name, req.body.text, req.note.id]
    );
    req.flash('success', 'Note is successfully updated');
    res.redirect(`/notes/${req.note.id}`);
  } catch (err) {
    res.locals.errors = helpers.formatModelErrors(err);
    res.render('notes/edit', { note: req.note });
  }
});

// Delete note
router.get('/notes/:id/delete', helpers.loginRequired, (req, res) => {
  res.render('notes/delete', { note: req.note });
});

router.post('/notes/:id/delete', helpers.loginRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.note.id]);
    req.flash('success', 'Note is successfully deleted');
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting note');
  }
});

module.exports = router;
