const express = require("express");
const router = express.Router();
const pool = require("../utils/dbConfig");
const { validatePassword } = require("../utils/passwordValidator");
const { generateAccessToken } = require("../utils/jwt");

router.post("/register", async (req, res) => {
  if (
    req.body.username == null ||
    req.body.email == null ||
    req.body.password == null ||
    req.body.age == null ||
    req.body.gender == null
  ) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  if (req.body.username.length < 3 || req.body.username.length > 20) {
    res.status(400).json({
      message: "Username must be at least 3 characters long and at most 20",
    });
    return;
  }
  if (req.body.age < 1 || req.body.age > 99) {
    res.json({ message: "Age must be 1-99 years" }).status(400);
    return;
  }

  const errors = validatePassword(req.body.password);

  if (errors.length) {
    res
      .status(400)
      .json({ message: "Passowrd doesn't abide by the standarts" });
    return;
  }

  const { username, email, password, age, gender } = req.body;
  pool.query(
    "INSERT INTO users (username, email, password, age, gender,date) VALUES ($1, $2, $3, $4, $5,$6)",
    [username, email, password, age, gender, new Date().toISOString()],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        if (err.message.includes("username")) {
          res.status(400).json({ message: "Username already exists" });
        } else {
          res.status(400).json({ message: "Email already exists" });
        }
      } else {
        pool.query(
          "SELECT user_id FROM users WHERE username = $1",
          [username],
          (err, result) => {
            if (err) {
              console.error("DBError: " + err.message);
              res

                .json({
                  message:
                    "Database error! Hold on tight and try again in a few minutes.",
                })
                .status(500);
            } else {
              const user_id = result.rows[0].user_id;
              const token = generateAccessToken(
                username,
                email,
                false,
                user_id
              );
              res.status(200).json({ token: token });
              res.end();
            }
          }
        );
      }
    }
  );
});

router.post("/login", (req, res) => {
  if (req.body.username == null || req.body.password == null) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }
  const { username, password } = req.body;
  pool.query(
    "SELECT * FROM users WHERE username = $1 AND password = $2",
    [username, password],
    (err, result) => {
      if (err) {
        console.error("DBError: " + err.message);
        res
          .json({
            message:
              "Database error! Hold on tight and try again in a few minutes.",
          })
          .status(500);
      } else {
        if (result.rows.length) {
          //get user_id
          pool.query(
            "SELECT user_id FROM users WHERE username = $1",
            [username],
            (err, result) => {
              if (err) {
                console.error("DBError: " + err.message);
                res
                  .json({
                    message:
                      "Database error! Hold on tight and try again in a few minutes",
                  })
                  .status(500);
              } else {
                const user_id = result.rows[0].user_id;

                const token = generateAccessToken(
                  result.rows[0].username,
                  result.rows[0].email,
                  true,
                  user_id
                );
                res.status(200).json({ token: token });
                res.end();
              }
            }
          );
        } else {
          res.status(400).json({ message: "Wrong username or password!" });
        }
      }
    }
  );
});

module.exports = router;
