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
    removePlayerFromRoom: removePlayerFromRoom,
    playerKillPlayer: playerKillPlayer,
    playerScanPlayer: playerScanPlayer,
    playerAccusePlayer: playerAccusePlayer,
    voteLynchYes: voteLynchYes,
    voteLynchNo: voteLynchNo,
    voteLynchAbstain: voteLynchAbstain
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
        Rooms.update(r._id, {$set: {message: 'It is night.  The villagers retreat to their homes.'}});
        Rooms.update(r._id, {$set: {phase: 'NIGHT'}});
        Rooms.update(r._id, {$set: {round: 'DANGER'}});
        Rooms.update(r._id, {$set: {playerKilled: false}});
        Rooms.update(r._id, {$set: {playerScanned: false}});
        Rooms.update(r._id, {$set: {playerAccusedId: null}});
        Rooms.update(r._id, {$set: {yesLynchVotes: 0}});
        Rooms.update(r._id, {$set: {noLynchVotes: 0}});
        Rooms.update(r._id, {$set: {abstainLynchVotes: 0}});
      }
      else if (seconds === 11) { // TODO: Set to 31 after testing
        if (!gameOver(r)) {
          // DAY phase, discussion: 90 seconds, from 31 to 120
          Rooms.update(r._id, {$set: {message: 'It is day.  The villagers gather to discuss the events of the night.'}});
          Rooms.update(r._id, {$set: {phase: 'DAY'}});
          Rooms.update(r._id, {$set: {round: 'DISCUSSION'}});
          Rooms.update(r._id, {$set: {playerKilled: false}});
        }
      }
      else if (seconds === 21) { // TODO: Set to 121 after testing
        // DAY phase, accusation: 30 seconds, from 121 to 150
        Rooms.update(r._id, {$set: {message: 'The villagers vote for who to place on trial.'}});
        Rooms.update(r._id, {$set: {round: 'ACCUSATION'}});
      }
      else if (seconds === 31) { // TODO: Set to 151 after testing
        // DAY phase, defense: 20 seconds, from 151 to 170

        // Gather all players eligible for trial
        var p;
        var playersAccused = [];
        Rooms.findOne(r._id).players.forEach(function(player) {
          p = Players.findOne(player._id);
          if (p.accusedVotes >= Rooms.findOne(r._id).minAccusedVotes) {
            playersAccused.push({
              _id: p._id,
              accusedVotes: p.accusedVotes
            });
          }

          // Reset each player's accusations for the next day's accusation round
          Players.update(p._id, {$set: {accusedPlayerId: null}});
          Players.update(p._id, {$set: {accusedVotes: 0}});

          // Reset each player's vote for the possibly upcoming judgment round
          Players.update(p._id, {$set: {hasVoted: false}});
        });

        // Place player with most votes on trial
        // If there is a tie, player with smallest array index is returned
        var playerAccused = _.max(playersAccused, function(player) {
          return player.accusedVotes;
        });

        if (playerAccused !== -Infinity) {
          Rooms.update(r._id, {$set: {message: 'The villager on trial may speak in his or her defense.'}});
          Rooms.update(r._id, {$set: {round: 'DEFENSE'}});
          Rooms.update(r._id, {$set: {playerAccusedId: playerAccused._id}});
        }
        else { // Required number of votes is not met, so no one goes on trial for this day
          // DAY phase, dusk: 5 seconds, from 151 to 155
          Rooms.update(r._id, {$set: {message: 'No one goes on trial.  Dusk has fallen.'}});
          Rooms.update(r._id, {$set: {round: 'DUSK'}});
        }
      }
      else if (seconds === 41 && Rooms.findOne(r._id).round === 'DEFENSE') { // TODO: Set to 171 after testing
        // DAY phase, judgment: 30 seconds, from 171 to 200
        Rooms.update(r._id, {$set: {message: "It's judgment time.  Should this fellow be lynched?"}});
        Rooms.update(r._id, {$set: {round: 'JUDGMENT'}});
      }
      else if (seconds === 51 && Rooms.findOne(r._id).round === 'JUDGMENT') { // TODO: Set to 201 after testing
        // DAY phase, verdict: 5 seconds, from 201 to 205
        Rooms.update(r._id, {$set: {round: 'VERDICT'}});

        // If votes are majority Yes compared to No, then player on trial is lynched
        // Abstain votes have no weight, meaning if everyone abstains but one votes Yes, player is lynched
        var p = Players.findOne(Rooms.findOne(r._id).playerAccusedId);
        if (Rooms.findOne(r._id).yesLynchVotes > Rooms.findOne(r._id).noLynchVotes) {
          Rooms.update(r._id, {$set: {message: 'Villager ' + p.name + ' has been lynched!'}});
          lynchPlayer(p);
        }
        else {
          Rooms.update(r._id, {$set: {message: 'Villager ' + p.name + ' lives to see another day.'}});
        }
      }
      else if (seconds === 55 || (seconds === 35 && Rooms.findOne(r._id).round === 'DUSK')) { // TODO: For testing only
      // else if (seconds === 205 || (seconds === 155 && Rooms.findOne(r._id).round === 'DUSK')) { // TODO: Use this after testing
        if (!gameOver(r)) {
          // Move on to the next night phase
          seconds = 0;
        }
      }

      // TODO: Remove latter portion of check
      var room = Rooms.findOne(r._id);
      if (room.state === 'FINISHED' || (room.players.length + 2) <= room.maxPlayers) {
        Meteor.clearInterval(currentGame);
        console.log('Game interval cleared for room ' + room.name);
      }
    }, 1000);
  }

  function gameOver(r) {
    var room = Rooms.findOne(r._id); // Must be queried again for updated good/evil count
    if (room.evilCount >= room.goodCount) {
      Rooms.update(r._id, {$set: {state: 'FINISHED'}});
      Rooms.update(r._id, {$set: {message: 'Evil has won in room ' + r.name}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Evil has won in room ' + r.name);
      // TODO: Broadcast message to room
      return true;
    }
    else if (room.evilCount === 0) {
      Rooms.update(r._id, {$set: {state: 'FINISHED'}});
      Rooms.update(r._id, {$set: {message: 'Good has won in room ' + r.name}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Good has won in room ' + r.name);
      // TODO: Broadcast message to room
      return true;
    }
    else {
      return false;
    }
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

    // TODO: For werewolf kill and seer scan testing purposes only
    // for (var i = 0; i < playerCount; i++) {
    //   player = r.players[i];
    //   if (player.name === 'one') {
    //     Players.update(player._id, {$set: {role: 'WEREWOLF'}}, null, function(err) {
    //       if (!err) {
    //         console.log('Successfully assigned role to ' + player.name);
    //       }
    //       else {
    //         console.log('Failed to assign role to player ' + player.name);
    //         console.log(err.reason);
    //       }
    //     });
    //   }
    //   else if (player.name === 'two') {
    //     Players.update(player._id, {$set: {role: 'SEER'}}, null, function(err) {
    //       if (!err) {
    //         console.log('Successfully assigned role to ' + player.name);
    //       }
    //       else {
    //         console.log('Failed to assign role to player ' + player.name);
    //         console.log(err.reason);
    //       }
    //     });
    //   }
    //   else {
    //     Players.update(player._id, {$set: {role: roles[i].name}}, null, function(err) {
    //       if (!err) {
    //         console.log('Successfully assigned role to ' + player.name);
    //       }
    //       else {
    //         console.log('Failed to assign role to player ' + player.name);
    //         console.log(err.reason);
    //       }
    //     });
    //   }
    // }

    // TODO: Uncomment later after testing
    for (var i = 0; i < playerCount; i++) {
      player = r.players[i];
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
    Rooms.update(r._id, {$set: {minAccusedVotes: 2}});
    Rooms.update(r._id, {$set: {playerAccusedId: null}});
    Rooms.update(r._id, {$set: {yesLynchVotes: 0}});
    Rooms.update(r._id, {$set: {noLynchVotes: 0}});
    Rooms.update(r._id, {$set: {abstainLynchVotes: 0}});

    // TODO: Remove after testing
    // Player cleanup
    Players.find().forEach(function(p) {
      Players.update(p._id, {$set: {role: null}});
      Players.update(p._id, {$set: {isAlive: true}});
      Players.update(p._id, {$set: {roomId: null}});
      Players.update(p._id, {$set: {accusedPlayerId: null}});
      Players.update(p._id, {$set: {accusedVotes: 0}});
      Players.update(p._id, {$set: {hasVoted: false}});
      Players.update(p._id, {$set: {hasBeenScanned: false}});
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

  function playerJoinRoom(room) {
    var r = Rooms.findOne(room._id);

    if (!Meteor.user()) {
      console.log('User was not signed in and therefore could not join room ' + r.name);
      return;
    }

    var username = Meteor.user().username;
    var currentPlayer = Players.findOne({name: username});

    // There's space left in the room for this player to join
    if (r.players.length < r.maxPlayers) {
      Rooms.update(r._id, {$addToSet: {players: currentPlayer}}, null, function(err) {
        if (!err) {
          // Update player room reference
          Players.update(currentPlayer._id, {$set: {roomId: r._id}});
          console.log(currentPlayer.name + ' joined room ' + r.name);
          // TODO: Broadcast a message to the room that player has joined
        }
        else {
          console.log('Error joining room ' + r.name);
        }
      });
    }
    else {
      console.log('Player ' + currentPlayer.name + ' attempted to join full room ' + r.name);
      // TODO: Send a message to the current player that the room is full
    }
  }

  function playerLeaveRoom(room) {
    var r = Rooms.findOne(room._id);
    var currentPlayer = Players.findOne({name: Meteor.user().username});

    var index = -1;
    for (var i = 0; i < r.players.length; i++) {
      if (r.players[i]._id === currentPlayer._id) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      Rooms.update(r._id, {$pop: {players: index}}, null, function(err) {
        if (!err) {
          // Update player room reference
          Players.update(currentPlayer._id, {$set: {roomId: null}});
          console.log(currentPlayer.name + ' left room ' + r.name);
          // TODO: Broadcast a message to the room that player has left
        }
        else {
          console.log('Error leaving room ' + r.name);
        }
      });
    }
  }

  function removePlayerFromRoom(roomId, currentPlayer) {
    var r = Rooms.findOne(roomId);

    var index = -1;
    for (var i = 0; i < r.players.length; i++) {
      if (r.players[i]._id === currentPlayer._id) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      Rooms.update(r._id, {$pop: {players: index}}, null, function(err) {
        if (!err) {
          // Update player room reference
          Players.update(currentPlayer._id, {$set: {roomId: null}});
          console.log('Removed disconnected player ' + currentPlayer.name + ' from room ' + r.name);
          // TODO: Broadcast a message to the room that player has left
        }
        else {
          console.log('Error leaving room ' + r.name);
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

          // Update the room's good/evil count
          var role = Roles.findOne({name: player.role});
          if (role.team === 'GOOD') {
            Rooms.update(room._id, {$set: {goodCount: room.goodCount - 1}});
          }
          else if (role.team === 'EVIL') {
            Rooms.update(room._id, {$set: {evilCount: room.evilCount - 1}});
          }

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
          Players.update(player._id, {$set: {hasBeenScanned: true}});
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
          return true;
        }
        else {
          console.log('Failed to accuse player ' + player.name);
          console.log(err.reason);
          return false;
        }
      });
    }
  }

  function voteLynchYes(r) {
    var room = Rooms.findOne(r._id);
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    if (!currentPlayer.hasVoted) {
      Rooms.update(room._id, {$set: {yesLynchVotes: room.yesLynchVotes + 1}});
      Players.update(currentPlayer._id, {$set: {hasVoted: true}});
    }
  }

  function voteLynchNo(r) {
    var room = Rooms.findOne(r._id);
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    if (!currentPlayer.hasVoted) {
      Rooms.update(room._id, {$set: {noLynchVotes: room.noLynchVotes + 1}});
      Players.update(currentPlayer._id, {$set: {hasVoted: true}});
    }
  }

  function voteLynchAbstain(r) {
    var room = Rooms.findOne(r._id);
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    if (!currentPlayer.hasVoted) {
      Rooms.update(room._id, {$set: {abstainLynchVotes: room.abstainLynchVotes + 1}});
      Players.update(currentPlayer._id, {$set: {hasVoted: true}});
    }
  }

  function lynchPlayer(player) {
    var room = Rooms.findOne(player.roomId);
    if (room && !room.playerKilled) {
      Players.update(player._id, {$set: {isAlive: false}}, null, function(err) {
        if (!err) {
          Rooms.update(room._id, {$set: {playerKilled: true}});
          console.log('Successfully lynched player ' + player.name);

          // Update the room's good/evil count
          var role = Roles.findOne({name: player.role});
          if (role.team === 'GOOD') {
            Rooms.update(room._id, {$set: {goodCount: room.goodCount - 1}});
          }
          else if (role.team === 'EVIL') {
            Rooms.update(room._id, {$set: {evilCount: room.evilCount - 1}});
          }

          return true;
        }
        else {
          console.log('Failed to lynch player ' + player.name);
          console.log(err.reason);
          return false;
        }
      });
    }
  }

});
