const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/studentsData').then(() => {
    console.log('Connection Successful');
}).catch((e) => {
    console.error(e);
});