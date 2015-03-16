Players = new Mongo.Collection('players');

Player = function(name) {
  this.name = name;
}
