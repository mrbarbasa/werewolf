Meteor.startup(function() {

  Meteor.methods({
    sendChatMessage: sendChatMessage,
    roomCreate: roomCreate,
    startGame: startGame,
    playerJoinRoom: playerJoinRoom,
    playerLeaveRoom: playerLeaveRoom,
    playerKillPlayer: playerKillPlayer,
    playerScanPlayer: playerScanPlayer,
    playerAccusePlayer: playerAccusePlayer,
    voteLynchYes: voteLynchYes,
    voteLynchNo: voteLynchNo
  });

  function sendServerMessage(roomId, message, filter) {
    var msg = {
      sender: 'SERVER',
      message: message,
      filter: filter || 'SERVER',
      timestamp: new Date()
    };
    Chats.update({roomId: roomId}, {$addToSet: {messages: msg}});
  }

  function sendChatMessage(message, filter) {
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    var msg = {
      sender: currentPlayer.name,
      message: message,
      filter: filter,
      timestamp: new Date(),
      playerId: currentPlayer._id
    };
    Chats.update({roomId: currentPlayer.roomId}, {$addToSet: {messages: msg}});
  }

  function roomCreate(roomName) {
    // If an existing room by the given name already exists, do not create a new room
    if (Rooms.findOne({name: roomName})) {
      return false;
    }

    var roomId = Rooms.insert(new Room(roomName));
    Chats.insert(new Chat(roomId, roomName));
    playerJoinRoom(Rooms.findOne(roomId), true);

    return {
      _id: roomId
    };
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
      }
      else if (seconds === 31) {
        if (!gameOver(r)) {
          // DAY phase, discussion: 90 seconds, from 31 to 120
          Rooms.update(r._id, {$set: {message: 'It is day.  The villagers gather to discuss the events of the night.'}});
          Rooms.update(r._id, {$set: {phase: 'DAY'}});
          Rooms.update(r._id, {$set: {round: 'DISCUSSION'}});
          Rooms.update(r._id, {$set: {playerKilled: false}});
        }
      }
      else if (seconds === 121) {
        // DAY phase, accusation: 30 seconds, from 121 to 150
        Rooms.update(r._id, {$set: {message: 'The villagers vote for who to place on trial.'}});
        Rooms.update(r._id, {$set: {round: 'ACCUSATION'}});
      }
      else if (seconds === 151) {
        // DAY phase, defense: 20 seconds, from 151 to 170

        // Gather all players eligible for trial
        var p;
        var playersAccused = [];
        Rooms.findOne(r._id).players.forEach(function(player) {
          p = Players.findOne(player._id);
          if (p.accusedVotes >= Rooms.findOne(r._id).minAccusedVotes) {
            playersAccused.push({
              _id: p._id,
              name: p.name,
              accusedVotes: p.accusedVotes
            });
          }
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
          sendServerMessage(r._id, 'Only ' + playerAccused.name + ' may speak at this time', 'DEFENSE');
        }
        else { // Required number of votes is not met, so no one goes on trial for this day
          // DAY phase, dusk: 5 seconds, from 151 to 155
          Rooms.update(r._id, {$set: {message: 'No one goes on trial.  Dusk has fallen.'}});
          Rooms.update(r._id, {$set: {round: 'DUSK'}});
        }
      }
      else if (seconds === 171 && Rooms.findOne(r._id).round === 'DEFENSE') {
        // DAY phase, judgment: 30 seconds, from 171 to 200
        Rooms.update(r._id, {$set: {message: "It's judgment time.  Should this fellow be lynched?"}});
        Rooms.update(r._id, {$set: {round: 'JUDGMENT'}});
      }
      else if (seconds === 201 && Rooms.findOne(r._id).round === 'JUDGMENT') {
        // DAY phase, verdict: 5 seconds, from 201 to 205
        Rooms.update(r._id, {$set: {round: 'VERDICT'}});

        var p;
        Rooms.findOne(r._id).players.forEach(function(player) {
          p = Players.findOne(player._id);
          // If player has not voted after judgment round is over, player abstained
          if (!p.hasVoted) {
            sendServerMessage(r._id, p.name + ' abstained', 'ABSTAINED');
          }

          // Reset each player's accusations for the next day's accusation round
          Players.update(p._id, {$set: {accusedPlayerId: null}});
          Players.update(p._id, {$set: {accusedVotes: 0}});

          // Reset each player's vote for the next day's judgment round
          Players.update(p._id, {$set: {hasVoted: false}});
        });

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
      else if (seconds === 205 || (seconds === 155 && Rooms.findOne(r._id).round === 'DUSK')) {
        if (!gameOver(r)) {
          // Move on to the next night phase
          seconds = 0;
        }
      }

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
      Rooms.update(r._id, {$set: {message: 'Werewolves win!'}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Evil has won in room ' + r.name);
      return true;
    }
    else if (room.evilCount === 0) {
      Rooms.update(r._id, {$set: {state: 'FINISHED'}});
      Rooms.update(r._id, {$set: {message: 'Villagers win!'}});
      console.log('Changed ' + r.name + ' room state to FINISHED');
      console.log('Good has won in room ' + r.name);
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

  function playerJoinRoom(room, isHost) {
    var r = Rooms.findOne(room._id);
    var username = Meteor.user().username;
    var currentPlayer = Players.findOne({name: username});

    Rooms.update(r._id, {$addToSet: {players: currentPlayer}}, null, function(err) {
      if (!err) {
        // Update player room reference
        Players.update(currentPlayer._id, {$set: {roomId: r._id}});

        if (isHost) {
          Players.update(currentPlayer._id, {$set: {isHost: true}});
          Rooms.update(r._id, {$set: {hostPlayerId: currentPlayer._id}});
        }

        console.log(currentPlayer.name + ' joined room ' + r.name);
        sendServerMessage(r._id, currentPlayer.name + ' joined the room');
      }
      else {
        console.log('Error joining room ' + r.name);
      }
    });
  }

  function playerLeaveRoom(roomId, thisPlayer, status) {
    var r = Rooms.findOne(roomId);
    var currentPlayer = thisPlayer || Players.findOne({name: Meteor.user().username});

    Rooms.update(r._id, {$pull: {players: {_id: currentPlayer._id}}}, null, function(err) {
      if (!err) {
        // Update player room reference
        Players.update(currentPlayer._id, {$set: {roomId: null}});

        // If room is still playing, add this player to the room's suicidal players' list
        if (r.state === 'PLAYING') {
          // Only add the necessary information, since actual player object should be free to play another game
          var suicidalPlayer = {
            _id: currentPlayer._id,
            name: currentPlayer.name,
            role: currentPlayer.role,
            roomId: currentPlayer.roomId
          };
          Rooms.update(r._id, {$addToSet: {suicidalPlayers: suicidalPlayer}});

          // Update the room's good/evil count
          var role = Roles.findOne({name: currentPlayer.role});
          if (role.team === 'GOOD') {
            Rooms.update(r._id, {$set: {goodCount: r.goodCount - 1}});
          }
          else if (role.team === 'EVIL') {
            Rooms.update(r._id, {$set: {evilCount: r.evilCount - 1}});
          }

          // Reset all of the player's game information, except their isHost property,
          //   which is evaluated separately
          Players.update(currentPlayer._id, {$set: {role: null}});
          Players.update(currentPlayer._id, {$set: {isAlive: true}});
          Players.update(currentPlayer._id, {$set: {roomId: null}});
          Players.update(currentPlayer._id, {$set: {accusedPlayerId: null}});
          Players.update(currentPlayer._id, {$set: {accusedVotes: 0}});
          Players.update(currentPlayer._id, {$set: {hasVoted: false}});
          Players.update(currentPlayer._id, {$set: {hasBeenScanned: false}});
        }

        if (status === 'DISCONNECTED') {
          console.log('Removed disconnected player ' + currentPlayer.name + ' from room ' + r.name);
        }
        else {
          console.log(currentPlayer.name + ' left room ' + r.name);
        }
        sendServerMessage(r._id, currentPlayer.name + ' left the room');

        // If the host leaves the room
        if (currentPlayer.isHost) {
          Players.update(currentPlayer._id, {$set: {isHost: false}});

          // Assign the next player as the host
          var remainingPlayers = Rooms.findOne(r._id).players;
          if (remainingPlayers.length > 0) {
            Rooms.update(r._id, {$set: {hostPlayerId: remainingPlayers[0]._id}}, null, function(err) {
              if (!err) {
                Players.update(remainingPlayers[0]._id, {$set: {isHost: true}});
                console.log('Set player ' + remainingPlayers[0].name + ' as new host of room ' + r.name);
                sendServerMessage(r._id, remainingPlayers[0].name + ' is now the host');
              }
            });
          }
          else {
            Rooms.update(r._id, {$set: {hostPlayerId: null}});
          }
        }
      }
      else {
        console.log('Error leaving room ' + r.name);
      }
    });
  }

  function playerKillPlayer(player) {
    var room = Rooms.findOne(player.roomId);
    if (room && !room.playerKilled) {
      Players.update(player._id, {$set: {isAlive: false}}, null, function(err) {
        if (!err) {
          Rooms.update(room._id, {$set: {playerKilled: true}});
          console.log('Successfully killed player ' + player.name);
          sendServerMessage(room._id, player.name + ' is dead', 'KILLED');

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
          sendServerMessage(room._id, currentPlayer.name + ' accused ' + player.name, 'ACCUSED');
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
      sendServerMessage(room._id, currentPlayer.name + ' voted guilty', 'GUILTY');
    }
  }

  function voteLynchNo(r) {
    var room = Rooms.findOne(r._id);
    var currentPlayer = Players.findOne({name: Meteor.user().username});
    if (!currentPlayer.hasVoted) {
      Rooms.update(room._id, {$set: {noLynchVotes: room.noLynchVotes + 1}});
      Players.update(currentPlayer._id, {$set: {hasVoted: true}});
      sendServerMessage(room._id, currentPlayer.name + ' voted innocent', 'INNOCENT');
    }
  }

  function lynchPlayer(player) {
    var room = Rooms.findOne(player.roomId);
    if (room && !room.playerKilled) {
      Players.update(player._id, {$set: {isAlive: false}}, null, function(err) {
        if (!err) {
          Rooms.update(room._id, {$set: {playerKilled: true}});
          console.log('Successfully lynched player ' + player.name);
          sendServerMessage(room._id, player.name + ' got lynched', 'LYNCHED');

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

  Rooms.find().observeChanges({
    changed: function(id, newFields) {
      var r = Rooms.findOne(id);

      if (newFields.players) {
        // If the room is empty, delete the room
        if (newFields.players.length === 0) {
          Chats.remove({roomId: r._id}, function(err) {
            if (!err) {
              Rooms.remove(r._id, function(err) {
                if (!err) {
                  console.log('Deleted empty room ' + r.name);
                }
              });
            }
          });
        }
      }
    }
  });

});
