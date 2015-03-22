Meteor.startup(function() {

  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime,
    executeUserAction: executeUserAction,
    startGame: startGame,
    gameCleanup: gameCleanup,
    playerJoinRoom: playerJoinRoom,
    playerLeaveRoom: playerLeaveRoom,
    playerKillPlayer: playerKillPlayer,
    playerScanPlayer: playerScanPlayer,
    playerAccusePlayer: playerAccusePlayer
  });

  // TODO: For testing only
  Players.update({name: 'one'}, {$set: {isHost: true}});

  function getServerTime(r) {
    var timeStart = Rooms.findOne(r._id).startTime;
    // .fromNow() // 3 minutes ago
    // .fromNow(true) // 3 minutes
    var timeElapsed = moment(timeStart).fromNow(true);
    return timeElapsed;
  }

  function startGame(r) {
    // Change room state from waiting to playing
    Rooms.update(r._id, {$set: {state: 'PLAYING'}}, null, function(err) {
      if (!err) {
        console.log('Changed ' + r.name + ' room state to PLAYING');
        // Set up game
        gameSetup(r);
      }
    });

    // Game loop
    var seconds = 0;
    var currentGame = Meteor.setInterval(function() {
      seconds++;
      Rooms.update(r._id, {$set: {seconds: seconds}});

      if (seconds === 1) {
        // NIGHT phase: 30 seconds, from 1 to 30
        Rooms.update(r._id, {$set: {message: 'It is night.  The villgers retreat to their homes.'}});
        Rooms.update(r._id, {$set: {phase: 'NIGHT'}});
        Rooms.update(r._id, {$set: {round: 'DANGER'}});
        Rooms.update(r._id, {$set: {playerKilled: false}});
        Rooms.update(r._id, {$set: {playerScanned: false}});
      }
      // else if (seconds === 11) { // TODO: Set to 31 after testing
      //   // DAY phase, discussion: 90 seconds, from 31 to 120
      //   Rooms.update(r._id, {$set: {message: 'It is day.  The villagers gather to discuss the events of the night.'}});
      //   Rooms.update(r._id, {$set: {phase: 'DAY'}});
      //   Rooms.update(r._id, {$set: {round: 'DISCUSSION'}});
      //   Rooms.update(r._id, {$set: {playerKilled: false}});
      // }
      else if (seconds === 11) { // TODO: Set to 121 after testing
        // DAY phase, accusations: 30 seconds, from 121 to 150
        Rooms.update(r._id, {$set: {message: 'The villagers vote for who to place on trial.'}});
        Rooms.update(r._id, {$set: {phase: 'DAY'}}); // TODO: Remove this later
        Rooms.update(r._id, {$set: {round: 'ACCUSATION'}});

        // First player to reach the required number of votes is placed on trial


        // If required number of votes is not met, no one goes on trial for this day
        // if () {
        //   // Move on to the next night phase
        //   seconds = 0;
        // }
      }
      // TODO: Testing only
      else if (seconds === 25) {
        seconds = 0;
      }
      // else if (seconds === 151) {
      //   Rooms.update(r._id, {$set: {message: 'The villager on trial may speak in his or her defense.'}});
      //   // DAY phase, defense: 20 seconds, from 151 to 170
      //   Rooms.update(r._id, {$set: {round: 'DEFENSE'}});

      //   // If someone is put on trial, give them 20-30 seconds of self-defense
      //   // No one else is permitted to speak at this time
      // }
      // else if (seconds === 171) {
      //   Rooms.update(r._id, {$set: {message: "It's judgment time.  Should this fellow be lynched?"}});
      //   // DAY phase, judgment: 30 seconds, from 171 to 200
      //   Rooms.update(r._id, {$set: {round: 'JUDGMENT'}});

      //   // Abstain votes have no weight
      //   // If votes are majority Yes compared to No,
      //   //   then player on trial is lynched
      // }
      // else if (seconds === 200) {
      //   // Move on to the next night phase
      //   seconds = 0;
      // }

      // TODO: Remove latter portion of check
      if (r.state === 'FINISHED' || (r.players.length + 2) <= r.maxPlayers) {
        Meteor.clearInterval(currentGame);
        console.log('Game finished');
      }
    }, 1000);
  }

  function gameSetup(r) {
    // Set a start time on the room
    setGameStartTime(r);
    // Randomly assign roles to players once the game starts
    assignRoles(r);

    // TODO: For testing only
    Players.find().forEach(function(p) {
      Players.update(p._id, {$set: {roomId: r._id}});
    });

    console.log('Finished game setup');
  }

  function setGameStartTime(r) {
    Rooms.update(r._id, {$set: {startTime: new Date()}});
  }

  function assignRoles(r) {
    //   _.shuffle([1, 2, 3, 4, 5, 6]);
    //   => [4, 1, 6, 3, 5, 2]
    var playerCount = r.players.length;
    var roles = _.shuffle(Roles.find({}, {limit: playerCount}).fetch());
    var player = null;

    // TODO: For werewolf kill testing purposes only
    for (var i = 0; i < playerCount; i++) {
      player = r.players[i];
      if (player.name === 'one') {
        Players.update(player._id, {$set: {role: 'WEREWOLF'}}, null, function(err) {
          if (!err) {
            console.log('Successfully assigned role to ' + player.name);
          }
          else {
            console.log('Failed to assign role to player ' + player.name);
            console.log(err.reason);
          }
        });
      }
      else if (player.name === 'two') {
        Players.update(player._id, {$set: {role: 'SEER'}}, null, function(err) {
          if (!err) {
            console.log('Successfully assigned role to ' + player.name);
          }
          else {
            console.log('Failed to assign role to player ' + player.name);
            console.log(err.reason);
          }
        });
      }
      else {
        Players.update(player._id, {$set: {role: roles[i].name}}, null, function(err) {
          if (!err) {
            console.log('Successfully assigned role to ' + player.name);
          }
          else {
            console.log('Failed to assign role to player ' + player.name);
            console.log(err.reason);
          }
        });
      }
    }

    // TODO: Uncomment later after testing
    // for (var i = 0; i < playerCount; i++) {
    //   player = r.players[i];
    //   Players.update(player._id, {$set: {role: roles[i].name}}, null, function(err) {
    //     if (!err) {
    //       console.log('Successfully assigned role to ' + player.name);
    //     }
    //     else {
    //       console.log('Failed to assign role to player ' + player.name);
    //       console.log(err.reason);
    //     }
    //   });
    // }
  }

  function gameCleanup(r) {
    // Room cleanup
    Rooms.update(r._id, {$set: {state: 'WAITING'}}, null, function(err) {
      if (!err) {
        console.log('Changed ' + r.name + ' room state to WAITING');
      }
    });
    Rooms.update(r._id, {$set: {goodCount: 6}});
    Rooms.update(r._id, {$set: {evilCount: 2}});
    Rooms.update(r._id, {$set: {livingPlayers: 8}});
    Rooms.update(r._id, {$set: {phase: null}});
    Rooms.update(r._id, {$set: {round: null}});
    Rooms.update(r._id, {$set: {startTime: null}});
    Rooms.update(r._id, {$set: {seconds: 0}});
    Rooms.update(r._id, {$set: {message: null}});
    Rooms.update(r._id, {$set: {mode: 'EASY'}});
    Rooms.update(r._id, {$set: {playerKilled: false}});
    Rooms.update(r._id, {$set: {playerScanned: false}});

    // TODO: Remove after testing
    // Player cleanup
    Players.find().forEach(function(p) {
      Players.update(p._id, {$set: {role: null}});
      Players.update(p._id, {$set: {isAlive: true}});
      Players.update(p._id, {$set: {roomId: null}});
      Players.update(p._id, {$set: {accusedPlayerId: null}});
      Players.update(p._id, {$set: {accusedVotes: 0}});
    });

    // TODO: Use this instead, after testing
    // Player cleanup
    // Rooms.findOne({name: r.name}).players.forEach(function(p) {
    //   Players.update(p._id, {$set: {role: null}});
    //   Players.update(p._id, {$set: {isAlive: true}});
    //   Players.update(p._id, {$set: {isHost: false}}); // TODO: Maybe not until leaving room
    //   Players.update(p._id, {$set: {roomId: null}}); // TODO: Maybe not until leaving room
    // });

    //--- TODO: For testing purposes only
    // Hello room cleanup
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

    // All rooms cleanup
    Rooms.find().forEach(function(room) {
      if (room.name !== 'Hello') {
        Rooms.update(room._id, {$set: {players: []}});
      }
    });
    //--- END: For testing purposes only

    console.log('Finished game cleanup');
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

    // Update player room reference
    var room = Rooms.findOne({name: roomName});
    Players.update(currentPlayer._id, {$set: {roomId: room._id}});

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

    // Update player room reference
    Players.update(currentPlayer._id, {$set: {roomId: null}});

    var index = r.players.indexOf(currentPlayer); // TODO: This doesn't appear to be working properly
    if (index > -1) {
      Rooms.update(r._id, {$pop: {players: index}}, null, function(err) {
        if (!err) {
          console.log(currentPlayer.name + ' left room ' + r.name);
          // TODO: Broadcast a message to the room that player has left
        }
      });
    }
  }

  function playerKillPlayer(player) {
    var room = Rooms.findOne(player.roomId);
    if (room && !room.playerKilled) {
      Players.update(player._id, {$set: {isAlive: false}}, null, function(err) {
        if (!err) {
          Rooms.update(room._id, {$set: {playerKilled: true}});
          console.log('Successfully killed player ' + player.name);
          return true;
        }
        else {
          console.log('Failed to kill player ' + player.name);
          console.log(err.reason);
          return false;
        }
      });
    }
  }

  function playerScanPlayer(player) {
    var room = Rooms.findOne(player.roomId);
    if (room && !room.playerScanned) {
      Rooms.update(room._id, {$set: {playerScanned: true}}, null, function(err) {
        if (!err) {
          console.log('Successfully scanned player ' + player.name);
          return true;
        }
        else {
          console.log('Failed to scan player ' + player.name);
          console.log(err.reason);
          return false;
        }
      });
    }
  }

  function playerAccusePlayer(player) {
    var room = Rooms.findOne(player.roomId);
    var currentPlayer = Players.findOne({name: Meteor.user().username});

    if (room) {
      // This shouldn't happen due to client-side logic, but in case
      //   current player tries to accuse the same player, return immediately
      if (currentPlayer.accusedPlayerId && currentPlayer.accusedPlayerId === player._id) {
        return;
      }

      // If current player already accused someone, remove their vote
      //   from that player before assigning their vote to the new player
      if (currentPlayer.accusedPlayerId) {
        var prevAccusedPlayer = Players.findOne(currentPlayer.accusedPlayerId);
        Players.update(prevAccusedPlayer._id, {$set: {accusedVotes: prevAccusedPlayer.accusedVotes - 1}});
      }

      // Assign the current player's vote to the new player
      var playerAccusedVotes = player.accusedVotes + 1;
      Players.update(player._id, {$set: {accusedVotes: playerAccusedVotes}}, null, function(err) {
        if (!err) {
          Players.update(currentPlayer._id, {$set: {accusedPlayerId: player._id}});
          console.log('Successfully accused player ' + player.name);

          // TODO: Check if playerAccusedVotes is enough to send player to trial

          return true;
        }
        else {
          console.log('Failed to accuse player ' + player.name);
          console.log(err.reason);
          return false;
        }
      });

      console.log('Accused votes = ' + player.accusedVotes);
    }
  }

});
