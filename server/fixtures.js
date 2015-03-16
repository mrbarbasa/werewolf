if (Rooms.find().count() === 0) {
  Rooms.insert(new Room('Hello'));

  Rooms.insert(new Room('Most'));

  Rooms.insert(new Room('Cruel', 2));

  Rooms.insert(new Room('Awesome', 2));

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
