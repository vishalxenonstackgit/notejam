const express = require('express');
const router = express.Router();
const debug = require('debug')('http');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const stubTransport = require('nodemailer-stub-transport');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const helpers = require('../helpers');
const settings = require('../settings');

const pool = new Pool(settings);

// Helper function to hash passwords
function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

function checkPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

// Passport Auth Settings
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async function (email, password, done) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
          return done(null, false, { message: 'Unknown user ' + email });
        }
        if (!checkPassword(user, password)) {
          return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Sign-Up Routes
router.get('/signup', (req, res) => {
  res.render('users/signup');
});

router.post('/signup', async (req, res) => {
  const data = req.body;
  if (data.password) {
    data.password = generateHash(data.password);
  }
  try {
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [data.email, data.password]
    );
    req.flash('success', 'User successfully created. Now you can sign in.');
    res.redirect('/signin');
  } catch (err) {
    res.locals.errors = helpers.formatModelErrors(err);
    res.render('users/signup');
  }
});

// Sign-In Routes
router.get('/signin', (req, res) => {
  res.render('users/signin');
});

router.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/signin');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  })(req, res, next);
});

// Account Settings Routes
router.get('/settings', helpers.loginRequired, (req, res) => {
  res.render('users/settings');
});

router.post('/settings', async (req, res) => {
  const { password, new_password, confirm_new_password } = req.body;
  const user = req.user;

  if (new_password !== confirm_new_password) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/settings');
  }

  if (!checkPassword(user, password)) {
    req.flash('error', 'Current password is incorrect.');
    return res.redirect('/settings');
  }

  try {
    const hash = generateHash(new_password);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
    req.flash('success', 'Password successfully updated.');
    res.redirect('/');
  } catch (err) {
    res.locals.errors = [err.message];
    res.render('users/settings');
  }
});

// Forgot Password Routes
router.get('/forgot-password', (req, res) => {
  res.render('users/forgot-password');
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      req.flash('error', 'No user found with the provided email.');
      return res.redirect('/forgot-password');
    }

    const newPassword = Math.random().toString(36).substring(2, 12);
    const hash = generateHash(newPassword);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
    sendNewPassword(user, newPassword);

    req.flash('success', 'A new password has been sent to your email.');
    res.redirect('/signin');
  } catch (err) {
    res.locals.errors = [err.message];
    res.render('users/forgot-password');
  }
});

// Helper to Send Password Reset Email
function sendNewPassword(user, password) {
  const mailer = nodemailer.createTransport(stubTransport());
  mailer.sendMail(
    {
      from: 'noreply@notejamapp.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Your new password: ${password}`
    },
    (err, info) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Password reset email sent:', info.messageId);
      }
    }
  );
}

// Logout Route
router.get('/signout', (req, res) => {
  req.logout(() => {
    res.redirect('/signin');
  });
});

module.exports = router;
