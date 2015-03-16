Meteor.startup(function() {

  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime,
    executeUserAction: executeUserAction,
    playerJoinRoom: playerJoinRoom,
    playerLeaveRoom: playerLeaveRoom
  });

  // TODO: Later after testing, decrease the ms interval
  Meteor.setInterval(updateRooms, 3000);

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
    this.numPlayersPlaying = 0; // TODO: Implement if needed
    this.numPlayersWaiting = this.numPlayersOnline - this.numPlayersPlaying;
    this.totalRooms = Rooms.find().count();
    this.numRoomsPlaying = Rooms.find({state: 'PLAYING'}).count();
    this.numRoomsWaiting = Rooms.find({state: 'WAITING'}).count();;
  }

  function updateRooms() {
    console.log('Updating rooms...');

    Rooms.find().forEach(function(r) {
      // Delete the room if the game is finished
      //   or if the room is ready or playing, but empty
      //   TODO: Later after testing, also delete rooms that are waiting and empty
      if (r.state === 'FINISHED' || (r.state !== 'WAITING' && r.players.length <= 0)) {
        Rooms.remove(r._id, function(err) {
          if (!err) {
            console.log('Deleted finished/empty room ' + r.name);
          }
        });
      }

      if (r.state !== 'FINISHED' && r.players.length > 0) {
        // Change room state from ready to playing
        if (r.state === 'READY') {
          Rooms.update(r._id, {$set: {state: 'PLAYING'}});
          console.log('Changed ' + r.name + ' room state to PLAYING');
        }

        gameLoop(r);
      }
    });
  }

  function gameLoop(r) {
    // Update room
    if (r.state === 'PLAYING') {
      console.log('Room ' + r.name + ' is playing');
    }
  }

  function playerJoinRoom(roomName) {
    if (!Meteor.user()) {
      console.log('User was not signed in and therefore could not join room ' + roomName);
      return;
    }

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

  function playerLeaveRoom(roomName) {
    var r = Rooms.findOne({name: roomName});
    var currentPlayer = Players.findOne({name: Meteor.user().username});

    var index = r.players.indexOf(currentPlayer);
    Rooms.update(r._id, {$pop: {players: index}}, null, function(err) {
      if (!err) {
        console.log(currentPlayer.name + ' left room ' + r.name);
        // TODO: Broadcast a message to the room that player has left

        // If player leaves the room, set room state to waiting
        if (r.state === 'READY') {
          Rooms.update(r._id, {$set: {state: 'WAITING'}});
          console.log('Changed ' + r.name + ' room state to WAITING');
        }
      }
    });
  }

});
