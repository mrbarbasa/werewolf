Players = new Mongo.Collection('players');

Player = function(name, userId) {
  this.name = name;
  this.role = null;
  this.isAlive = true;
  this.isHost = false;
  this.roomId = null;
  this.accusedPlayerId = null; // Who this player accused
  this.accusedVotes = 0; // Number of players who accused this player
  this.hasVoted = false;
  this.hasBeenScanned = false;
  this.userId = userId || null;
};
