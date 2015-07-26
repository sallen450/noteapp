var express = require('express');
var app = express();
var route = require('./routes/index');
var bodyParser = require('body-parser');
var multer = require('multer');
var ejs = require('ejs');

app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer());

app.use(route);

var server = app.listen(3000, "127.0.0.1", function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
