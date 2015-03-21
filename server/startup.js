Meteor.startup(function() {

  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime,
    executeUserAction: executeUserAction,
    playerJoinRoom: playerJoinRoom,
    playerLeaveRoom: playerLeaveRoom
  });

  // TODO: May not use interval after all or set a different interval per room
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
        // TODO: Uncomment later
        // Rooms.remove(r._id, function(err) {
        //   if (!err) {
        //     console.log('Deleted finished/empty room ' + r.name);
        //   }
        // });
      }

      // TODO: For testing purposes only
      if (r.players.length === 0 && r.state === 'PLAYING') {
        // Change room state from playing to waiting
        Rooms.update(r._id, {$set: {state: 'WAITING'}}, null, function(err) {
          if (!err) {
            console.log('Changed ' + r.name + ' room state to WAITING');
            // Meteor.clearInterval(test); // This works, just set interval to var test
          }
        });
      }
      if (r.name === 'Hello' && r.players.length <= 6 && r.state === 'PLAYING') {
        // Change room state from playing to waiting
        Rooms.update(r._id, {$set: {state: 'WAITING'}}, null, function(err) {
          if (!err) {
            console.log('Changed ' + r.name + ' room state to WAITING');
            // Meteor.clearInterval(test); // This works, just set interval to var test
          }
        });

        // Room cleanup
        var testRoom = Rooms.findOne({name: 'Hello'});
        Rooms.update(testRoom._id, {$set: {players: []}});
        var playerNames = ['three', 'four', 'five', 'six', 'seven', 'eight'];
        var currentPlayer;
        for (var i = 0; i < playerNames.length; i++) {
          currentPlayer = Players.findOne({name: playerNames[i]});
          Rooms.update(testRoom._id, {$addToSet: {players: currentPlayer}}, null, function(err) {
            if (!err) {
              console.log(currentPlayer.name + ' joined room ' + testRoom.name);
            }
          });
        }
      }
      // END: For testing purposes only

      if (r.state !== 'FINISHED' && r.players.length > 0) {
        // Change room state from ready to playing
        if (r.state === 'READY') {
          Rooms.update(r._id, {$set: {state: 'PLAYING'}}, null, function(err) {
            if (!err) {
              console.log('Changed ' + r.name + ' room state to PLAYING');
              // Set up game
              gameSetup(r);
            }
          });
        }

        gameLoop(r);
      }
    });
  }

  function assignRoles(r) {
    //   _.shuffle([1, 2, 3, 4, 5, 6]);
    //   => [4, 1, 6, 3, 5, 2]
    var playerCount = r.players.length;
    var roles = _.shuffle(Roles.find({}, {limit: playerCount}).fetch());
    var player = null;

    for (var i = 0; i < playerCount; i++) {
      player = r.players[i];
      Players.update(player._id, {$set: {role: roles[i].name}}, null, function(err) {
        if (!err) {
          console.log('Successfully assigned role to ' + player.name);
        }
        else {
          console.log('Error updating players');
          console.log(err.reason);
        }
      });
    }
  }

  function gameSetup(r) {
    // Randomly assign roles to players once the game starts
    assignRoles(r);
    // Reset room fields to default in case same room is used
    Rooms.update(r._id, {$set: {goodCount: 6}});
    Rooms.update(r._id, {$set: {evilCount: 2}});
    Rooms.update(r._id, {$set: {livingPlayers: 8}});
    Rooms.update(r._id, {$set: {phase: 'NIGHT'}});
    Rooms.update(r._id, {$set: {round: 1}});
  }

  function gameLoop(r) {
    // Update room
    if (r.state === 'PLAYING') {
      console.log('[' + r.name + '] Now playing');

      runPhase(r, 'NIGHT');
      // Check if the win conditions have been met
      if (!gameOver(r)) {
        runPhase(r, 'DAY');

        // Check again if the win conditions have been met
        if (!gameOver(r)) {
          Rooms.update(r._id, {$set: {round: r.round + 1}}); // Increment the current round by 1
        }
      }
    }
  }

  function runPhase(r, phase) {
    if (phase === 'NIGHT') {
      if (r.phase !== 'NIGHT') {
        Rooms.update(r._id, {$set: {phase: 'NIGHT'}});
      }
      console.log('[' + r.name + '] Running NIGHT phase, round ' + r.round);
      // TODO: Broadcast
    }
    else if (phase === 'DAY') {
      if (r.phase !== 'DAY') {
        Rooms.update(r._id, {$set: {phase: 'DAY'}});
      }
      console.log('[' + r.name + '] Running DAY phase, round ' + r.round);
      // TODO: Broadcast

      // Announce to all players who is dead
      //   or if someone has been saved (do not reveal who was saved)

      // If a player is dead, disable his ability
      //   to chat with living players
      // Dead players can only chat with other dead players

      // If easy mode, their identity is revealed,
      //   else if hard mode, their identity remains hidden

      // Allow 1-2 minutes of discussion

      // Judgment time for 30 seconds to a minute
      // First player to reach the required number of votes is put on trial
      // If required number of votes is not met, no one goes on trial this day
      // Go to next night phase

      // If someone is put on trial, give them 20-30 seconds of self-defense
      // No one else is permitted to speak at this time

      // Voting time for all players, 30 seconds or 1 minute
      // Abstain votes have no weight
      // If votes are majority Yes compared to No,
      //   then player on trial is lynched
      // Go to next night phase
    }
  }

  function gameOver(r) {
    if (r.evilCount >= r.goodCount) {
      Rooms.update(r._id, {$set: {state: 'FINISHED'}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Evil has won in room ' + r.name);
      // TODO: Broadcast message to room
      return true;
    }
    else if (r.evilCount === 0) {
      Rooms.update(r._id, {$set: {state: 'FINISHED'}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Good has won in room ' + r.name);
      // TODO: Broadcast message to room
      return true;
    }
    else {
      return false;
    }
  }

  function playerJoinRoom(roomName) {
    if (!Meteor.user()) {
      console.log('User was not signed in and therefore could not join room ' + roomName);
      return;
    }

    var username = Meteor.user().username;
    var currentPlayer = Players.findOne({name: username});
    // If a user is logged in and has no associated player object, create a new player
    if (!currentPlayer) {
      // TODO: Move this elsewhere; create player object earlier, when user creates an account
      Players.insert(new Player(username), function(err, playerId) {
        if (!err && playerId) {
          currentPlayer = Players.findOne(playerId);
          console.log('New player object was created for user ' + username);
        }
        else {
          console.log('Could not create a player object for user ' + username);
          return;
        }
      });
    }

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
