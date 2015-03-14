function Room(name, maxPlayers) {
  this.name = name;
  this.maxPlayers = maxPlayers || 8;
  this.playerCount = 0;
  this.players = [];
  this.state = 'WAITING'; // WAITING, READY, PLAYING, FINISHED
  this.type = 'Default';

  console.log('Creating room named ' + this.name + ' for ' + this.maxPlayers + ' players');
}

if (Rooms.find().count() === 0) {
  Rooms.insert(new Room('Hello'));

  Rooms.insert(new Room('Most'));

  Rooms.insert(new Room('Cruel'));

  Rooms.insert(new Room('Awesome'));

  Rooms.insert(new Room('World'));
}

if (Roles.find().count() === 0) {
  Roles.insert({
    name: 'Villager 1'
  });

  Roles.insert({
    name: 'Villager 2'
  });

  Roles.insert({
    name: 'Villager 3'
  });

  Roles.insert({
    name: 'Villager 4'
  });

  Roles.insert({
    name: 'Villager 5'
  });

  Roles.insert({
    name: 'Evildoer 1'
  });

  Roles.insert({
    name: 'Evildoer 2'
  });

  Roles.insert({
    name: 'Neutral 1'
  });
}
