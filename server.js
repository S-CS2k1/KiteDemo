require('dotenv').config();

const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
// 'mongodb://localhost:27017/Kite'
const dbURL = process.env.DB_URL || 'mongodb://136.233.9.106:27017/Kite';
const mongoose  = require('mongoose');
mongoose.connect(dbURL)
    .then(() => {
        console.log("Connected")
    })
    .catch(err =>{
        console.log("Connection failed",err)
    })

const schema  = new mongoose.Schema({
    emailID : {
        type : String,
        required: true,
    },
    password : String,
    username : String
});

const User = mongoose.model("User", schema);

app.set("view engine","ejs");
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.listen(process.env.PORT || 3000);

app.get("/register",(req, res)=>{
    res.render("register");
});
const hashingPassword = async (req, res, next)=>{
    const {password} = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    next();
};
app.post("/register", hashingPassword, (req, res)=>{
    const {body} = req;
    const add = new User(body);
    const added = add.save();
    added.then((ob)=>{
        res.send(`${ob.username} is registered successfully`);
    })
    .catch((e)=>{
        res.send(`Registration Unsuccessfull ${e}`);
    });
});


app.get("/login",(req, res)=>{
    res.render("login");
});
app.post("/login", (req, res)=>{
    const {emailID, password} = req.body;
    User.findOne({emailID})
    .then( async (ob)=>{
        console.log(password);
        const validPassword = await bcrypt.compare(password, ob.password);
        if(validPassword){
            const user = {
                username : ob.username, 
                emailID : ob.emailID,
                exp : Math.floor(Date.now() / 1000) + (30 * 60)
            };
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.render("home",{token});
        }else{
            res.send("EmailID or password is incorrect");
        }
    })
    .catch(()=>{
        res.send("EmailID or password is incorrect 1");
    })
});

app.get("/try/access/:jt",(req, res)=>{
    const decodeToken = jwt.decode(req.params.jt);
    const {iat, exp} = decodeToken;
    console.log(decodeToken);
    console.log(Math.floor(Date.now()/1000) - exp);
    if(Math.floor(Date.now()/1000) - iat > 0){
        if(exp - Math.floor(Date.now()/1000) > 0){
            console.log(exp - Math.floor(Date.now()/1000));
            res.render("details",{decodeToken});
        }else{
            res.render("expired");
        }
    }else{
        res.render("expired");
    }
});