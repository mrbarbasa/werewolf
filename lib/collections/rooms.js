Rooms = new Mongo.Collection('rooms');

Room = function(name, maxPlayers) {
  this.name = name;
  this.maxPlayers = maxPlayers || 8;
  this.players = [];
  this.state = 'WAITING'; // WAITING, PLAYING, FINISHED
  this.goodCount = 6; // TODO: Hardcoded for now
  this.evilCount = 2; // TODO: Hardcoded for now
  this.livingPlayers = 8; // TODO: Hardcoded for now; might not need
  this.phase = null; // NIGHT, DAY
  this.round = null; // DANGER, DISCUSSION, ACCUSATION, DEFENSE, JUDGMENT
  this.startTime = null; // TODO: Might not need this
  this.seconds = 0;
  this.message = null;
  this.mode = 'EASY'; // EASY, HARD
  this.playerKilled = false;
  this.playerScanned = false;

  console.log('Created room named ' + this.name + ' for ' + this.maxPlayers + ' players');
}
