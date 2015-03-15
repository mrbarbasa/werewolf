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
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    var roomExists = false;

    // Possibly change to a for loop in order to break immediately once room is found
    Rooms.find().forEach(function(r) {
      if (r.name === roomName) {
        roomExists = true;

        // There's space left in the room for this player to join
        if (r.players.length < r.maxPlayers) {
          Rooms.update(r._id, {$addToSet: {players: currentPlayer}}, null, function(err) {
            if (!err) {
              // currentPlayer.room = r; // TODO: Set player reference to this room
              console.log(currentPlayer.name + ' joined room ' + r.name);
              // TODO: Broadcast a message to the room that player has joined

              // Change room state if necessary
              // Note: r.players.length may not reflect updated value, so add 1 to the check just in case
              if (r.players.length + 1 >= r.maxPlayers) {
                // Change room state to ready if the room is full
                if (r.state === 'WAITING') {
                  Rooms.update(r._id, {$set: {state: 'READY'}});
                  console.log('Changed ' + r.name + ' room state to READY');
                }
              }
            }
          });
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
