Players = new Mongo.Collection('players');

Player = function(name) {
  this.name = name;
  this.role = null;
  this.isAlive = true;
  this.isHost = false;
  this.roomId = null;
}
