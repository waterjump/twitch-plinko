var express = require('express');
var app = express();
// var sassMiddleware = require('node-sass-middleware');
// var path = require('path');

// app.use(
//   sassMiddleware({
//     /* Options */
//     src: path.join(__dirname, 'sass'),
//     dest: path.join(__dirname, 'public/stylesheets'),
//     debug: true,
//     outputStyle: 'compressed' //,
//      // prefix:  '/prefix'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
// })
// );

app.use(express.static('public'));

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
