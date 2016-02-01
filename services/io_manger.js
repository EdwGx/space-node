"use strict";
var player = require('./player.js');
var HumanPlayer = player.human_player;

class ioManger {
  attach(io) {
    this.io = io;
    io.manger = this;
    io.on('connection', this.onConnection);
  }

  onConnection(socket) {
    console.log('a socket connected');
    var player = new HumanPlayer(socket);
    if (io_manger.box.addPlayer(player)) {
      socket.emit('join_response', 'joined');

      socket.on('disconnect', function(){
        io_manger.box.removePlayer(player);
      });

      socket.on('dir_change', function(data){
        player.move(data);
      });
    } else {
      socket.emit('join_response', 'wait');
    }
  }

  emitAllPlayers(e, data) {
    for (player of this.box.players) {
      if (player.socket) {
        player.socket.emit(e, data);
      }
    }
  }

  addBox(box) {
    this.box = box;
    box.io_manger = this;
  }

  ready() {
    this.emitAllPlayers('ready');
  }

  start() {
    this.emitAllPlayers('start');
  }
}

var io_manger = new ioManger();

module.exports = io_manger;
