const express = require('express');
var port = process.env.PORT || 3000;
var http = require('http'),
    app = express();
var io = require('socket.io')(require('http').Server(app));

var duplicate = require('./duplicateServer/duplicate');

var serverA = serverB = {};

duplicate.init(function(a, b) {
  serverA = a;
  serverB = b;
  checkForUpdates("", "");
});

app.use('/healthcheck',function(req, res) {
  res.send('Healthy');
});

app.use(express.static('duplicateClient'));

var server = http.createServer(app).listen(port, function() {
  console.log("Listening on http://127.0.0.1:"+port);
});

io = io.listen(server);

io.sockets.on("connection", function(socket) {
  socket.send({
    'status': 'Logged In',
    'serverA' : serverA,
    'serverB' : serverB
  });
  console.log("Client connected");
});

var checkForUpdates = function(previousA, previousB) {
  var latestA = latestB = "";
  duplicate.checkWorkbooks(serverA, function(workbookA){
    io.emit('checkWorkbooks', {
      server: 'A',
      message: 'Checking for new workbooks'
    });
    latestA = workbookA;
    duplicate.checkWorkbooks(serverB, function(workbookB){
      io.emit('checkWorkbooks', {
        server: 'B',
        message: 'Checking for new workbooks'
      });
      latestB = workbookB;
      if (previousA == "" && previousB == "") {
        io.emit('checkWorkbooks', {
          server: 'A',
          message: 'No new workbooks'
        });
        io.emit('checkWorkbooks', {
          server: 'B',
          message: 'No new workbooks'
        });
        setTimeout(function() {
          checkForUpdates(latestA, latestB);
        }, 30000)
      } else if (JSON.stringify(previousA) != JSON.stringify(latestA)) {
        //Download from A and publish to B
        io.emit('checkWorkbooks', {
          server: 'A',
          message: 'New workbook found ('+ latestA[0].name +')'
        });
        transferWorkbook(serverA, serverB, latestA[0], function(savedWorkbook) {
          io.emit('checkWorkbooks', {
            server: 'B',
            message: 'Workbook received'
          });
          io.emit('checkWorkbooks', {
            server: 'A',
            message: 'Workbook transfer complete'
          });
          latestB = savedWorkbook;
          setTimeout(function() {
            checkForUpdates(latestA, latestB);
          }, 30000)
        });
      } else if (JSON.stringify(previousB) != JSON.stringify(latestB)) {
        io.emit('checkWorkbooks', {
          server: 'B',
          message: 'New workbook found ('+ latestB[0].name +')'
        });
        transferWorkbook(serverB, serverA, latestB[0], function(savedWorkbook) {
          io.emit('checkWorkbooks', {
            server: 'A',
            message: 'Workbook received'
          });
          io.emit('checkWorkbooks', {
            server: 'B',
            message: 'Workbook transfer complete'
          });
          latestA = savedWorkbook;
          setTimeout(function() {
            checkForUpdates(latestA, latestB);
          }, 30000)
        });
      } else {
        io.emit('checkWorkbooks', {
          server: 'A',
          message: 'No new workbooks'
        });
        io.emit('checkWorkbooks', {
          server: 'B',
          message: 'No new workbooks'
        });
        setTimeout(function() {
          checkForUpdates(latestA, latestB);
        }, 30000)
      }
    });
  });
}


var transferWorkbook = function(source, destination, workbook, callback) {

}
