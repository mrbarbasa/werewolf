Rooms = new Mongo.Collection('rooms');

Room = function(name, maxPlayers) {
  this.name = name;
  this.maxPlayers = maxPlayers || 8;
  this.players = [];
  this.state = 'WAITING'; // WAITING, PLAYING, FINISHED
  this.goodCount = 6; // Number of living players on team GOOD
  this.evilCount = 2; // Number of living players on team EVIL
  this.livingPlayers = 8; // TODO: Hardcoded for now; might not need
  this.phase = null; // NIGHT, DAY
  this.round = null; // DANGER, DISCUSSION, ACCUSATION, DEFENSE, DUSK, JUDGMENT, VERDICT
  this.startTime = null; // TODO: Might not need this
  this.seconds = 0;
  this.message = null;
  this.mode = 'EASY'; // EASY, HARD
  this.playerKilled = false;
  this.playerScanned = false;
  this.minAccusedVotes = 2;
  this.playerAccusedId = null;
  this.yesLynchVotes = 0;
  this.noLynchVotes = 0;
  this.hostPlayerId = null;
  this.suicidalPlayers = [];
};
