"use strict";
var space_ship = require('./space_ship.js');
var MannedShip = space_ship.MannedShip;

class GameManger {

  constructor() {
    this.ships = {};
    this.shipCount = 0;
    this.bullets = [];
    this.spaceObjects = [];
    this.state = "idle";
    //
    // idle -> server_ready -(1s)-> client_ready
    //  |                                    |
    //  --<-(10s)-finish <- active <-(3s)-----
    //
    this.lps = 30; //Logic
    this.fps = 60; //Graphics

    this.loopInterval = Math.round(1000/this.lps);
    this.graphicsInterval = Math.round(1000/this.fps);

    this.timer;

    this.colors = ["a", "b", "c", "d"];
    this.shipThreshold = Math.min(2, this.colors.length);

    this.size = [600, 500];

    this.startTimestamp = 0;
    this.lastTimestamp = 0;
  }

  attach(io) {
    this.io = io;
    io.on('connection', this.onConnection.bind(this));
  }

  onConnection(socket) {
    var ship = new MannedShip();

    if (this.addShip(ship)) {
      console.log(`Ship ${ship.color} connected`);
      var shipColor = ship.color;
      socket.color = shipColor;
      ship.socket = socket;

      socket.emit('join_response', {
        "joined": true,
        "interval": this.graphicsInterval,
        "ship": ship.toAbstract(),
        "size": this.size
      });

      socket.on('disconnect', function(){
        delete this.ships[shipColor];
        this.shipCount -= 1;
        if ( this.shipCount == 0 ){
          this.state = "idle";
        }
      }.bind(this));

      socket.on('dir_change', function(data){
        ship.move(data);
      });
    } else {
      socket.emit('join_response', {
        "joined": false
      });
    }

    socket.on('ping-test', function(data){
      socket.emit('ping-test', Date.now());
    });
  }

  addShip(ship) {
    if (this.state == "idle") {
      var color;
      for (var kColor of this.colors) {
        if ( !(kColor in this.ships) ){
          ship.color = kColor;
          break;
        }
      }
      this.ships[ship.color] = ship;
      this.shipCount += 1;
      if (Object.keys(this.ships).length >= this.shipThreshold) {
        this.state = "server_ready";
        setTimeout(this.ready.bind(this), 1000);
      }
      return true;
    }
    return false;
  }

  ready(){
    if (this.state == "server_ready") {
      this.state = "client_ready";
      this.emitAllShips("ready");
      setTimeout(this.start.bind(this), 3000);
    }
  }

  start() {
    if (this.state == "client_ready") {
      this.state = "active";

      var dirtyShips = [];
      this.eachShips(function(ship){
        dirtyShips.push(ship.toAbstract());
      });

      this.startTimestamp = Date.now();
      this.lastTimestamp = this.startTimestamp;

      this.emitAllShips("start", { ships: dirtyShips });
      this.timer = setInterval(this.loop.bind(this), this.loopInterval);
      this.loop();
    }
  }

  loop() {
    if (this.state != "active") {
      clearInterval(this.timer);
      return;
    }

    var delta_time = Date.now() - this.lastTimestamp;
    this.lastTimestamp += delta_time;

    var dirtyShips = [];
    this.eachShips(function(ship){
      ship.update(delta_time);
      ship.bound(this.size);
      if (ship.dirty) {
        ship.dirty = false;
        dirtyShips.push(ship.toAbstract());
      }
    });
    if (dirtyShips.length > 0) {
      this.emitAllShips('update', { ships: dirtyShips, t: (this.lastTimestamp - this.startTimestamp) });
    }
  }

  emitAllShips(e, data) {
    this.eachShips(function(ship){
      if (ship.socket) {
        ship.socket.emit(e, data);
      }
    });
  }

  eachShips(callback) {
    for (var shipColor in this.ships) {
      callback.call(this, this.ships[shipColor]);
    }
  }
}

module.exports = GameManger;
