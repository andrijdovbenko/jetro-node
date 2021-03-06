let express = require('express');
let router = express.Router();
let crypto = require('crypto');
let keys = require('../keys.json');
let db = require('../db-connect');

router.get('/', function(req, res, next) {
  if (req.session.isLogged) {
    req.session.isAdmin = false;
    req.session.isLogged = false;
    req.session.userName = '';
  }
  let data = {
    isAdmin: req.session.isAdmin,
    isLogged: req.session.isLogged
  };
  res.render('login', data);
});

router.post('/', function(req, res, next) {
  let login = req.body.login;
  let password = req.body.password;
  let cryptoPassword = crypto.createCipher('aes-256-ctr', keys.cryptoKey).update(password, 'utf-8', 'hex');

  db.users.findOne({login: login}, (err, user) => {
    if (err) {
      res.render('error', err);
    }
    if (user) {
      if (user.password === cryptoPassword && user.isAdmin) {
        req.session.isAdmin = true;
        req.session.isLogged = true;
        req.session.userName = `${user.firstName} ${user.lastName}`;
        res.sendStatus(200);
      } else if (user.password === cryptoPassword) {
        req.session.isAdmin = false;
        req.session.isLogged = true;
        req.session.userName = `${user.firstName} ${user.lastName}`;
        res.sendStatus(200);
      } else {
        req.session.isLogged = false;
        req.session.isAdmin = false;
        req.session.userName = '';
        res.statusCode = 403;
        res.json({'field': 'password', 'text': 'Wrong password'});
      }
    } else {
      req.session.isAdmin = false;
      res.statusCode = 403;
      res.json({'field': 'login', 'text': 'The user with this login doesn\'t exist'});
    }
  });
});

module.exports = router;
