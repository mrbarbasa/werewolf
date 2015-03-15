Meteor.startup(function() {
  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime,
    executeUserAction: executeUserAction,
    playerJoinRoom: playerJoinRoom
  });

  function getServerTime() {
    var timeNow = (new Date()).toTimeString();
    return timeNow;
  }

  function executeUserAction() {
    var gstats = new GlobalStats();
    console.log(Meteor.userId());
    console.log(Meteor.user().username);
    console.log(gstats.numPlayersOnline);
  }

  function GlobalStats() {
    this.numPlayersOnline = Meteor.users.find({'status.online': true}).count();
    this.numPlayersPlaying = 0;
    this.numPlayersWaiting = this.numPlayersOnline - this.numPlayersPlaying;
    this.totalRooms = Rooms.find().count();
    this.numRoomsPlaying = Rooms.find({state: 'PLAYING'}).count();
    this.numRoomsWaiting = Rooms.find({state: 'WAITING'}).count();;
  }

  function playerJoinRoom(roomName) {
    var currentPlayer = Players.findOne({name: 'werewolfscarymuch'});
    var roomExists = false;

    // Possibly change to a for loop in order to break immediately once room is found
    Rooms.find().forEach(function(r) {
      if (r.name === roomName) {
        roomExists = true;

        // There's space left in the room for this player to join
        if (r.playerCount < r.maxPlayers) {
          Rooms.update(r._id, {$addToSet: {players: currentPlayer}});
          Rooms.update(r._id, {$inc: {playerCount: 1}});

          // Change room state if necessary
          if (r.playerCount < r.maxPlayers) {
            Rooms.update(r._id, {$set: {state: 'WAITING'}}); // Still waiting for players
          }
          else {
            // Change room state to ready if the room is full
            if (r.state === 'WAITING') {
              Rooms.update(r._id, {$set: {state: 'READY'}});
            }
          }

          // currentPlayer.room = r;
          console.log(currentPlayer.name + ' joined room ' + r.name);
          // TODO: Broadcast a message to the room that player has joined
        }
        else {
          console.log('Player ' + currentPlayer.name + ' attempted to join full room ' + r.name);
          // TODO: Send a message to the current player that the room is full
        }
      }
    });

    if (!roomExists) {
      console.log('Room named ' + roomName + ' was not found');
      // TODO: Send a message to the current player that the room was not found
    }
  }

});
