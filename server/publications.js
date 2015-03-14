Meteor.publish('users', function() {
  return Meteor.users.find({'status.online': true});
});

Meteor.publish('rooms', function() {
  return Rooms.find();
});

Meteor.publish('roles', function() {
  return Roles.find();
});

Meteor.users.find({'status.online': true}).observe({
  added: function(id) {
    // id just came online
  },
  removed: function(id) {
    // id just went offline
  }
});
