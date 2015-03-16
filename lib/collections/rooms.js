Rooms = new Mongo.Collection('rooms');

Room = function(name, maxPlayers) {
  this.name = name;
  this.maxPlayers = maxPlayers || 8;
  this.players = [];
  this.state = 'WAITING'; // WAITING, READY, PLAYING, FINISHED

  console.log('Created room named ' + this.name + ' for ' + this.maxPlayers + ' players');
}
