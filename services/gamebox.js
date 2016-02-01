"use strict";

class Gamebox {

  constructor() {

    this.players = [];
    this.bullets = [];
    this.spaceObjects = [];
    this.state = "idle";
    //
    // idle -> ready --(3s)--> active -> finish
    //  |                                    |
    //  --<--<--<--<--<--<--<--<--<--<--<--<--
    //
    this.fps = 1;
    this.loopInterval = Math.round(1000/this.fps);

    this.timer;

    this.playerThreshold = 1;
  }

  addPlayer(player) {
    if (this.state == "idle") {
      player.gamebox = this;
      this.players.push(player);
      if (this.players.length >= this.playerThreshold) {
        var box = this;
        this.state = "ready";
        setTimeout(function(){
          box.ready();
        }, 1000);
      }
      return true;
    }
    return false;
  }

  removePlayer(player) {
    var index = this.players.indexOf(player);
    if (index >= 0) {
      this.players.pop(index);
    }
    if (this.players.length == 0) {
      this.state = "idle";
    }
  }

  ready(){
    this.state = "ready";
    this.io_manger.ready();
    var box = this;
    setTimeout(function(){
      box.start()
    }, 3000);
    return true;
  }

  start() {
    if (this.state == "ready") {
      this.state = "active";
      this.io_manger.start();
      var box = this;
      this.timer = setInterval(function(){
        box.loop();
      }, this.loopInterval);
      return true;
    }
    return false;
  }

  loop() {
    if (this.state != "active") {
      clearInterval(this.timer);
      return;
    }
    var dirty = false;
    for (player of this.players) {
      player.update();
      dirty = dirty || player.dirty;
    }
    socket.emit('update', {"x":this.players[0].x, "y":this.players[0].y});
  }
}

module.exports = Gamebox;
