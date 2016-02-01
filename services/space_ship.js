"use strict";

class SpaceShip {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;

    this.dx = 0.0;
    this.dy = 0.0;

    this.speed = 0.1; //pixels per ms
    this.dirty = false;

    this.size = [20.0, 20.0];

    this.color = '0';
  }

  update(delta) {
    this.x += this.dx * delta;
    this.y += this.dy * delta;
  }

  bound(b) {
    this.x = Math.max(Math.min(this.x, b[0] - this.size[0]), 0);
    this.y = Math.max(Math.min(this.y, b[1] - this.size[1]), 0);
  }

  toAbstract() {
    return {
      "x":     this.x,
      "y":     this.y,
      "dx":    this.dx,
      "dy":    this.dy,
      "size":  this.size,
      "color": this.color
    }
  }
}

var DIRECTION_DICT = [[0.0,0.0],[-1.0,0.0],[0.0,-1.0],[1.0,0.0],[0.0,1.0]];

class MannedShip extends SpaceShip  {
  constructor() {
    super();
    this.direction = 0;
  }

  move(direction) {
    if ( direction != this.direction ) {
      this.direction = direction;
      this.dx = DIRECTION_DICT[direction][0] * this.speed;
      this.dy = DIRECTION_DICT[direction][1] * this.speed;
      this.dirty = true;
    }
  }
}
module.exports.MannedShip = MannedShip;
