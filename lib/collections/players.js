Players = new Mongo.Collection('players');

Player = function(name) {
  this.name = name;
  this.role = null;
  this.isAlive = true;
}
