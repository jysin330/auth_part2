require("dotenv").config();
require("./config/database").connect()
const express = require("express");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const cookieParser = require("cookie-parser");

// import model
const User = require("./models/user");
// custom middleware
const auth = require("./middleware/auth")

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("hello auth system")
})

// controller
// route /register
app.post("/register", async (res, req) => {
    
    try {
        // collect all info
        const { firstname, lastname, email, password } = req.body;
        // validate the data, if exists
        if (!(email && password && lastname && firstname)) {
            res.status(401).send("all fields are required")
        }
        //  check if user exists or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(401).send("user already found")
        }
        //  encrypt the password 
        const myEncyPassword = await bcrypt.hash(password, 10);

        //  create a new entry in database
        const user = await User.create({
            firstname,
            lastname,
            email,
            password: myEncyPassword
        })

        // create a token and send it to user
        const token = jwt.sign({
            id: user._id, email
        }, "shhhhh", { expiresIn: '2h' })

        user.token = token;
        // dont want to send the password
        user.password = undefined;
        res.status(201).json(user)

    } catch (error) {
        console.log(error);
        console.log("error is response route");
    }
})
//  /login
app.post("/login", async (req, res) => {
    try {
        // collected info from frontend
        const { email, password } = req.body;

        // validate
        if (!(email && password)) {
            res.status(401).send("emil and password is required")
        }
        // check user in db
        const user = await User.findOne({ email })

        //  if user doesnot exists- assignment --->

        // match the password
        if (user && (await bcrypt.compare(password.user.password))) {
            const token = jwt.sign({ id: user._id, email }, 'shhhhh', { expiresIn: '2h' })
            user.password = undefined;
            user.token = token;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            res.status(200).cookies("token", token, options).json({
                success: true,
                token,
                user
            })
        }

        // create token and send
        res.sendStatus(400).send("email or password is incorrect")
    } catch (error) {
        console.log(error)
    }
})
//  /dashboard
app.get("/dashboard", (req, auth, onemore, res) => {
    res.send("welcome to dashboard")
})
module.exports = app;