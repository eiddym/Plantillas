var express = require('express');
var compression = require('compression');
var app = express();
var port = 3100;

var gzipStatic = require('connect-gzip-static')

app.use(compression());
app.use(gzipStatic(__dirname + '/dist'));

app.listen(port, function () {
  console.log('Frontend app listening on port: ' + port);
});