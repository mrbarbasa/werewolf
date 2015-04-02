Meteor.publish('users', function() {
  return Meteor.users.find({'status.online': true});
});

Meteor.publish('players', function() {
  return Players.find();
});

Meteor.publish('rooms', function() {
  return Rooms.find();
});

Meteor.publish('roles', function() {
  return Roles.find();
});

Meteor.publish('chats', function() {
  return Chats.find();
});
