//require ('dotenv').config();
import 'dotenv/config' //or using ES6?
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import CryptoJS from "crypto-js"


console.log(process.env.API_KEY);


const db = new pg.Client({ 
    user: "postgres",
    host: "localhost",
    database: "userDB",
    password: "sen123",
    port: 5432,
  });
  db.connect();
 
const app = express(); 
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


app.get("/",(req,res)=>{
    res.render("home.ejs");
})
app.get("/login",(req,res)=>{
    res.render("login.ejs");
})
app.get("/register",(req,res)=>{
    res.render("register.ejs");
})

let ciphertext;

app.post("/register",async (req,res)=>{
    const email = req.body.username;
    const regPassword = req.body.password;
    // Encrypt
ciphertext = CryptoJS.AES.encrypt(regPassword, process.env.SECRET).toString();
console.log("enc ",ciphertext);
    try{
        await db.query("INSERT INTO users (email, password) VALUES ($1,$2)",[email,ciphertext]);
        res.render("secrets.ejs");
    }catch (err) {
        console.error("Unable to insert records: ", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login",async (req,res)=>{
    const inputEmail = req.body.username;
    const inputPassword = req.body.password;

    try{
        const result = await db.query("SELECT * FROM users WHERE email = ($1)",[inputEmail]);
        if (result.rows.length ===0){
            //UserNotFound
            res.redirect("/");
            return;
        }
        const storeredCiphertext = result.rows[0].password;
        // Decrypt
        var bytes  = CryptoJS.AES.decrypt(storeredCiphertext, secret);
        var storedPassword = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
         // Compare the input password with the decrypted stored password
         const passwordsMatch = (inputPassword === storedPassword);
         console.log(inputPassword, storedPassword);
         if(passwordsMatch){
            res.render("secrets.ejs");
         }else{
            // Passwords do not match, redirect to the login page
            res.redirect("/");
         }
        }
         catch (error) {
            console.error("Error during login:", error);
            res.status(500).send("Internal Server Error");
        }

   
})



app.listen(port,()=>{
    console.log("Server is running on port "+port);
});

