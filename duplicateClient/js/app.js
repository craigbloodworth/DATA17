var socket = io();
socket.on('message', function(msg) {
  if (msg.status == "Logged In") {
    $('#serverAUrl').html(msg.serverA.url);
    $('#serverASite').html(msg.serverA.contentUrl);
    $('#serverAID').html(msg.serverA.siteID);
    $('#serverAToken').html(msg.serverA.token);
    $('#serverBUrl').html(msg.serverB.url);
    $('#serverBSite').html(msg.serverB.contentUrl);
    $('#serverBID').html(msg.serverB.siteID);
    $('#serverBToken').html(msg.serverB.token);
  }
});

socket.on('checkWorkbooks', function(msg) {
  $('#output' + msg.server).append(msg.message + '<br/>');
})
