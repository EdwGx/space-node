var socket = io();

var gameScreen = document.getElementById("screen");
var prompter = document.getElementById("prompter");
var state = "connecting";

var pressedKey = 0;

var Engine = {
  ships: {},

  startTimestamp: 0,
  lastTimestamp: 0,
  size: [0,0],
  loopInterval: 100,

  addShips: function(ships) {
    for (var index in ships) {
      var ship = ships[ship];
      this.ships[ship.color] = ship;
    }
  },

  updateShips: function(timestamp, ships) {
    var delta = timestamp - ( this.lastTimestamp - this.startTimestamp );
    this.lastTimestamp = timestamp + this.startTimestamp;

    this.calcuateShips(delta);
    for (var index in ships) {
      var ship = ships[index];
      this.ships[ship.color] = ship;
    }
  },

  loop: function() {
    if (state != "active") {
      clearInterval(this.timer );
      return;
    }
    var delta = Date.now() - this.lastTimestamp;
    this.lastTimestamp += delta;

    this.eachShips(function(ship){
      ship.x += ship.dx * delta;
      ship.y += ship.dy * delta;

      ship.x = Math.max(Math.min(ship.x, this.size[0] - ship.size[0]), 0);
      ship.y = Math.max(Math.min(ship.y, this.size[1] - ship.size[1]), 0);

      $('#ship_' + ship.color).css({
        "left": ship.x,
        "top": ship.y,
      });
    });
  },

  calcuateShips: function(delta) {
    this.eachShips(function(ship){
      ship.x += ship.dx * delta;
      ship.y += ship.dy * delta;

      ship.x = Math.max(Math.min(ship.x, this.size[0] - ship.size[0]), 0);
      ship.y = Math.max(Math.min(ship.y, this.size[1] - ship.size[1]), 0);
    });
  },

  eachShips(callback) {
    for (var shipColor in this.ships) {
      callback.call(this, this.ships[shipColor]);
    }
  }
}

socket.on('join_response', function(data){
  if (state == "connecting") {
    if (data.joined) {
      document.body.setAttribute('data-state', 'wait-players');
      Engine.size = data.size;
      Engine.loopInterval = data.interval;
    } else {
      document.body.setAttribute('data-state', 'wait');
      prompter.innerHTML = "Game is currently running";
    }
  }
});

socket.on('ready', function(){
  state = "ready";
  document.body.setAttribute('data-state', 'ready');
  prompter.innerHTML = "3";
  setTimeout(prompterDecrease, 1000);
});

function prompterDecrease(){
  var count = parseInt(prompter.innerHTML) - 1;
  if (count > 1) {
    prompter.innerHTML = String(count);
    setTimeout(prompterDecrease, 1000);
  } else {
    prompter.innerHTML = String(count);
  }
}

socket.on('start',function(data){
  document.body.setAttribute('data-state', 'active');
  $('#screen').css({
    width: Engine.size[0],
    height: Engine.size[1]
  });
  state = "active";

  Engine.startTimestamp = Date.now();
  Engine.lastTimestamp = Engine.startTimestamp;

  var ships = data.ships;

  for (var index in ships) {
    var ship = ships[index];
    var ship_div = $('<div class="space-ship">').css({
      "left": ship.x,
      "top": ship.y,
    }).attr({
      "data-color": ship.color,
      "id": ("ship_" + ship.color)
    });
    $(gameScreen).append(ship_div)
  }

  Engine.timer = setInterval(Engine.loop.bind(Engine), Engine.loopInterval);
  Engine.loop();
});

socket.on('update', function(data){
  Engine.updateShips(data.t, data.ships);
});

document.onkeydown = function(event) {
  if (state == 'active') {
    event = event || window.event;
    if (event.keyCode < 41 && event.keyCode > 36) {
      var dir = event.keyCode - 36;
      if (dir != pressedKey) {
        pressedKey = dir;
        socket.emit('dir_change', dir);
      }
    }
  }
};

document.onkeyup = function(event) {
  if (state == 'active') {
    event = event || window.event;
    if (event.keyCode < 41 && event.keyCode > 36 && pressedKey == (event.keyCode - 36)) {
      pressedKey = 0;
      socket.emit('dir_change', 0);
    }
  }
};
