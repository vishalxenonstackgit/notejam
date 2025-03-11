const express = require('express');
const session = require('express-session');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const users = require('./routes/users');
const pads = require('./routes/pads');
const notes = require('./routes/notes');
const settings = require('./settings'); // Database connection settings
const { User, Pad } = require('./models'); // Import User and Pad models

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Passport LocalStrategy configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return done(null, false, { message: 'Invalid email or password.' });
    }

    const isValidPassword = await User.validatePassword(password, user.password); // Ensure this method exists
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password.' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Flash messages setup
app.use((req, res, next) => {
  res.locals.flash_messages = {
    success: req.flash('success'),
    error: req.flash('error'),
  };
  next();
});

// Inject user pads into view scope
app.use(async (req, res, next) => {
  res.locals.req = req;

  if (req.isAuthenticated()) {
    try {
      const pads = await Pad.findByUserId(req.user.id); // Fetch user-specific pads
      res.locals.pads = pads;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Route handlers
app.use('/', users);
app.use('/', pads);
app.use('/', notes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Development error handler
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// Production error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

module.exports = app;
