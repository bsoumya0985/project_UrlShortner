const express = require('express');
const app = express();
const mongoose = require('mongoose');
const route = require('../src/routes/route');

app.use(express.json());
app.use('/', route)

try {
    mongoose.connect("mongodb+srv://soumya0985:ZtoqUK1lBKP7jUtw@cluster0.lwz2n.mongodb.net/group62-database?authSource=admin&replicaSet=atlas-12u83k-shard-0&readPreference=primary&ssl=true", {useNewUrlParser:true});
    console.log(`MongoDB Connection Successful`);

} catch (error) {
    console.log(error);
}


const port = process.env.PORT || 3000;
app.listen(port, console.log(`Express App running on port ${port}`))