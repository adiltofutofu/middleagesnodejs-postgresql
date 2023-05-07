const express = require('express');
const app = express();
var path = require('path');
const bcrypt = require('bcrypt');
const session = require("express-session");
const flash = require("express-flash");
const passport = require('passport')

const initializePassport = require("./passport_config");
initializePassport(passport);

const { pool } = require("./db_config");

const PORT = process.env.PORT || 4000;


app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))

app.use(session({
    secret: "secret",

    resave: false, 

    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash())


app.get("/", (req, res) => {
    res.render('home.ejs')
})

app.get("/knight_signup", checkAuthenticated, (req, res) => {
    res.render('knight_signup.ejs')
})
/* - - - - - - users auth - - - - - - - */
app.get("/login_knight", checkAuthenticated, (req, res) => {
    res.render('login_knight.ejs')
})

app.get("/login_mage", (req, res) => {
    res.render('login_mage.ejs')
})

app.get("/login_dragon", (req, res) => {
    res.render('login_dragon.ejs')
})
/* - - - - - - - - - - - - - - - - - - */
app.get("/dashboard", checkNotAuthenticated, (req, res) => {

    res.render('dashboard.ejs', 
    { 
        knight_name: req.user.name,
        knight_secret_phase: req.user.secret_phase,
        knight_location: req.user.location,
        knight_house: req.user.house,
        knight_coins: req.user.coins,
    })
})

app.get("/knight_logout", function(req, res, next) {
    req.logout(function(err) {
      if (err) {
        return next(err);
      }
      res.redirect("/login_knight");
    });
  });

app.get("/index", (req, res) => {
    res.render('index.ejs');
});

app.get("/home", (req, res) => {
    res.render('home.ejs');
});

app.listen(PORT, () => {
    console.log('server running on port');
});

app.post("/knight_signup", async (req, res) => {
    let {name, house, location, secret_phase, coins} = req.body;

    console.log({
        name, house, location , secret_phase, coins
    })

    let errors = [];

    if (!name || !house || !location || !secret_phase|| !coins) {
        errors.push({ message: "Please enter all fields" });   
    };

    if (secret_phase.length < 6) {
        errors.push ({ message: "Your secret phase is too short" })
    }

    if (errors.length > 0) {
        res.render("/knight_signup", { errors })
    } else { 
        let hashedPassword = await bcrypt.hash(secret_phase, 10)

        pool.query(
            `SELECT * FROM knight
            WHERE name = $1`, 
            [name],
            (err, results) => {
                if (err) {
                    throw err;
                }
            console.log(results.rows)
                if (results.rows.length > 0){
                    errors.push({message: "This knight is already entered!"})
                    res.render('/knight_signup', {errors})
                } else {
                    pool.query(
                        `INSERT INTO knight (name, house, location, secret_phase, coins)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, secret_phase`, 
                        [name, house, location, hashedPassword, coins],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash('seccess_msg', "You are now registered in Middleearth Kingdom!")
                            res.redirect("/login_knight");
                        }
                    )
                }
            }
        )
    }
});

app.post("/login_knight",
    passport.authenticate("local", {
      successRedirect: "dashboard",
      failureRedirect: "/login_knight",
      failureFlash: true
    })
  );


  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("dashboard");
    }
    next();
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login_knight");
  }
  

app.use(express.static(__dirname + '/public'));