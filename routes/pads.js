const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const helpers = require('../helpers');
const settings = require('../settings');

const pool = new Pool(settings);

// Create new pad
router.get('/pads/create', helpers.loginRequired, (req, res) => {
  res.render('pads/create');
});

router.post('/pads/create', helpers.loginRequired, async (req, res) => {
  const data = req.body;
  data['user_id'] = req.user.id;

  try {
    await pool.query(
      'INSERT INTO pads (name, user_id) VALUES ($1, $2)',
      [data.name, data.user_id]
    );
    req.flash('success', 'Pad is successfully created');
    res.redirect('/');
  } catch (err) {
    res.locals.errors = helpers.formatModelErrors(err);
    res.render('pads/create');
  }
});

// Inject pad in request
router.use('/pads/:id', async (req, res, next) => {
  if (req.user) {
    try {
      const result = await pool.query(
        'SELECT * FROM pads WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) {
        res.status(404).send('Pad not found');
        return;
      }
      req.pad = result.rows[0];
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Pad notes
router.get('/pads/:id', helpers.loginRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE pad_id = $1 ORDER BY updated_at DESC',
      [req.pad.id]
    );
    const notes = result.rows;
    res.render('pads/list', {
      title: `${req.pad.name} (${notes.length})`,
      pad: req.pad,
      notes: notes
    });
  } catch (err) {
    res.status(500).send('Error fetching notes');
  }
});

// Edit pad
router.get('/pads/:id/edit', helpers.loginRequired, (req, res) => {
  res.render('pads/edit', { pad: req.pad });
});

router.post('/pads/:id/edit', helpers.loginRequired, async (req, res) => {
  try {
    await pool.query(
      'UPDATE pads SET name = $1 WHERE id = $2',
      [req.body.name, req.pad.id]
    );
    req.flash('success', 'Pad is successfully updated');
    res.redirect('/');
  } catch (err) {
    res.locals.errors = helpers.formatModelErrors(err);
    res.render('pads/edit', { pad: req.pad });
  }
});

// Delete pad
router.get('/pads/:id/delete', helpers.loginRequired, (req, res) => {
  res.render('pads/delete', { pad: req.pad });
});

router.post('/pads/:id/delete', helpers.loginRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM pads WHERE id = $1', [req.pad.id]);
    req.flash('success', 'Pad is successfully deleted');
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting pad');
  }
});

module.exports = router;
