Rooms = new Mongo.Collection('rooms');

Room = function(name, maxPlayers) {
  this.name = name;
  this.maxPlayers = maxPlayers || 8;
  this.players = [];
  this.state = 'WAITING'; // WAITING, READY, PLAYING, FINISHED
  this.goodCount = 6; // TODO: Hardcoded for now
  this.evilCount = 2; // TODO: Hardcoded for now
  this.livingPlayers = 8; // TODO: Hardcoded for now
  this.phase = 'NIGHT'; // NIGHT, DAY
  this.round = 1;

  console.log('Created room named ' + this.name + ' for ' + this.maxPlayers + ' players');
}
