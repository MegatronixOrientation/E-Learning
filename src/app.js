const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const Student = require('./models/students');
require('./db/connection')
const PORT = process.env.PORT || 8080;

const publicPath = path.join(__dirname, '../public');
const templatePath = path.join(__dirname, '../template/views'); 
const partialsPath = path.join(__dirname, '../template/partials'); 

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(publicPath));
app.set('view engine', 'hbs');
app.set('views', templatePath);
hbs.registerPartials(partialsPath);

app.get('/', (req, res) => {
    res.render('index');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/quiz', (req, res) => {
    res.render('quiz');
});
app.get('/quizSet1', (req, res) => {
    res.render('quizSet1');
});
app.get('/quizSet2', (req, res) => {
    res.render('quizSet2');
});
app.get('/lobby', (req, res) => {
    res.render('lobby');
});
app.get('/online-class', (req, res) => {
    res.render('online-class');
});
app.get('/omr', (req, res) => {
    res.render('omr');
});

app.post('/login', async (req, res) => {
    try{
        const newStudent = new Student(req.body);
        console.log(newStudent);
        const saveStudentData = await newStudent.save();

        return res.status(201).redirect('/login');
    }catch (e) {
        return res.status(400).send(e);    
    }
});

app.post('/', async (req, res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        const storedData = await Student.findOne({email});

        const userEmail = storedData.email;
        const userPassword = storedData.password;

        console.log(`
            email : ${email}
            password : ${password}
            user_Email : ${userEmail}
            user_Pass : ${userPassword}
        `);

        if(email == userEmail && password === userPassword) {
            console.log('login successful');
            return res.status(200).redirect('/');
        }
        return res.status(401).send("<h1>Invalid Login Credentials</h1>");
    }catch(e) {
        return res.status(401).send('Invalid Login Credentials');
    }
});

app.listen(PORT, (req, res) => {
    console.log(`app is listening at PORT ${PORT}`);
});