const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');

const route = require('./routes/route');

const uri = process.env.mongoURI;

const app = express();

const port = process.env.PORT || 8080;

app.use(helmet());

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(route);

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        message: error.message
    });
});

app.use((req, res, next) => {
    res.status(404).json({
        message: 'invalid route'
    });
})

mongoose
    .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        const server = app.listen(port);
        const io = require('./socket').init(server);
        console.log(`Server running at port ${port}`);
    })
    .catch(err => {
        console.log(err);
    });