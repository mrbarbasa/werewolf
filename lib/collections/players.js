Players = new Mongo.Collection('players');

Player = function(name) {
  this.name = name;
  this.role = null;
  this.isAlive = true;
  this.isHost = false;
  this.roomId = null;
  this.accusedPlayerId = null; // Who this player accused
  this.accusedVotes = 0; // Number of players who accused this player
}
