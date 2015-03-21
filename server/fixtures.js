// TODO: Player fixtures are for testing purposes only
if (Players.find().count() === 0) {
  Players.insert(new Player('one'));

  Players.insert(new Player('two'));

  Players.insert(new Player('three'));

  Players.insert(new Player('four'));

  Players.insert(new Player('five'));

  Players.insert(new Player('six'));

  Players.insert(new Player('seven'));

  Players.insert(new Player('eight'));
}

if (Rooms.find().count() === 0) {
  Rooms.insert(new Room('Hello'));

  Rooms.insert(new Room('Most'));

  Rooms.insert(new Room('Cruel', 2));

  Rooms.insert(new Room('Awesome', 2));

  Rooms.insert(new Room('World'));

  // TODO: For testing purposes only
  var testRoom = Rooms.findOne({name: 'Hello'});
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

if (Roles.find().count() === 0) {
  Roles.insert(new Role('VILLAGER', 'VILLAGER', 'GOOD'));

  Roles.insert(new Role('VILLAGER', 'VILLAGER', 'GOOD'));

  Roles.insert(new Role('VILLAGER', 'VILLAGER', 'GOOD'));

  Roles.insert(new Role('VILLAGER', 'VILLAGER', 'GOOD'));

  Roles.insert(new Role('VILLAGER', 'VILLAGER', 'GOOD'));

  Roles.insert(new Role('WEREWOLF', 'MONSTER', 'EVIL'));

  Roles.insert(new Role('WEREWOLF', 'MONSTER', 'EVIL'));

  Roles.insert(new Role('SEER', 'VILLAGER', 'GOOD'));
}
