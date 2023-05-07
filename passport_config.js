const localStrategy = require("passport-local").Strategy;
const { pool } = require("./db_config");
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateknight = (name, secret_phase, done) => {
        pool.query(
            `SELECT * FROM knight WHERE name = $1`, 
            [name],
            (err, results) => {
                if (err) {
                    throw err;
                }
    
                console.log(results.rows);
    
                if (results.rows.length > 0) {
    
                    const knight = results.rows[0];
    
                    bcrypt.compare(secret_phase, knight.secret_phase, (err, isMatch) => {
                        if (err) {
                            throw err;
                        }
    
                        if (isMatch) {
                            return done(null, knight)
                        } else {
                            return done(null, false,  {message: "Secret phase is not correct!"})
                        }
                    }); 
                } else {
                    return done (null, false, {message: "This knight haven't been here!"})
                }
            }
        )
    };

    passport.use (
        new localStrategy(
        {
            usernameField: "name", 
            passwordField: "secret_phase"
        }, 
        authenticateknight
        )
    );
    

    passport.serializeUser((knight, done) => done(null, knight.id));

    passport.deserializeUser((id, done) => {
        pool.query(`SELECT * FROM knight WHERE id = $1`, [id], (err, results) => {
          if (err) return done(err);
          if (results.rows[0]) {
            return done(null, results.rows[0]);
          } else {
            return done(null, false)
          }
      
        });
      });
}


module.exports = initialize;

