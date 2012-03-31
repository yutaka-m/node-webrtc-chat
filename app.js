var app = require('express').createServer();
var io = require('socket.io').listen(app);

app.get('/',function(req,res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/md5.min.js',function(req,res) {
  res.sendfile(__dirname + '/md5.min.js');
});

var rooms = new Array();

var chat = io.of('/chat').on('connection', function(socket) {
  
  // Room予約
  // 戻り値
  // 0 : Room使用可能通知(正常：２回目)
  // 1 : Room予約完了通知(正常：１回目)
  // 2 : 既に使用済み
  // 3 : 既に予約済み
  socket.on('room', function(data) {
    console.log('room');
    var json = JSON.parse(data);
    var member = rooms[json.name];
    var result = -1;
    
    if (undefined == member) { 
      member = new Array();
    }
    
    if (member.length > 2) {
      result = 2;
      chat.sockets[socket.id].emit('resultRoom',JSON.stringify(result));
      return;
    }
    
    if (member.indexOf(socket.id) != -1) {
      result = 3; 
      chat.sockets[socket.id].emit('resultRoom',JSON.stringify(result));
      return;
    } else {
      member.push(socket.id);
      rooms[json.name] = member;
      if (member.length == 2) {
        result = 0;
        if (member[0] in chat.sockets) 
          chat.sockets[member[0]].emit('resultRoom',JSON.stringify(result));
      } else {
        result = 1;
        chat.sockets[socket.id].emit('resultRoom',JSON.stringify(result));
      }
      return;
    }
  });
  
  // SDPメッセージ通信
  socket.on('sdp', function(data) {
    console.log('sdp');
    var json = JSON.parse(data);
    var member = rooms[json.name];
    if (undefined == member) { console.log('no member'); return; }
    
    for(var i=0;i < member.length; i++) {
      if (member[i] != socket.id) {
        if (member[i] in chat.sockets) 
          chat.sockets[member[i]].emit('resultSDP',JSON.stringify(json.sdp));
      }
    }
  });
  
  socket.on('disconnect', function () {
    console.log('disconnect');
    // clear room
  });
});
  
app.listen(3001);
