var socket = io();
socket.on('message', function(msg) {
  if (msg.status == "Logged In") {
    $('#serverAUrl').html('<a href="'+msg.serverA.url+'" target="_blank">' + msg.serverA.url + '</a>');
    if (msg.serverA.contentUrl == '') {
      $('#serverASite').html('<a href="'+msg.serverA.url+'" target="_blank">Default</a>');
    } else {
      $('#serverASite').html('<a href="'+msg.serverA.url+'/t/'+msg.serverA.contentUrl+'" target="_blank">' + msg.serverA.contentUrl + '</a>');
    }
    $('#serverAToken').html(msg.serverA.token);
    $('#serverBUrl').html('<a href="'+msg.serverB.url+'" target="_blank">' + msg.serverB.url + '</a>');
    if (msg.serverB.contentUrl == '') {
      $('#serverBSite').html('<a href="'+msg.serverB.url+'" target="_blank">Default</a>');
    } else {
      $('#serverBSite').html('<a href="'+msg.serverB.url+'/t/'+msg.serverB.contentUrl+'" target="_blank">' + msg.serverB.contentUrl + '</a>');
    }
    $('#serverBToken').html(msg.serverB.token);
  }
});

socket.on('checkWorkbooks', function(msg) {
  $('#output' + msg.server).append(msg.message + '<br/>');
  $('#output' + msg.server).animate({scrollTop: $('#output' + msg.server).get(0).scrollHeight}, 500);
})
