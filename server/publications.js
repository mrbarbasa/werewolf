Meteor.publish('users', function() { // 'userStatus'
  return Meteor.users.find({'status.online': true});
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
