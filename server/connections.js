UserStatus.events.on('connectionLogin', function(connectionInfo) {
  console.log('User ' + Meteor.users.findOne(connectionInfo.userId).username + ' is now online');
});

UserStatus.events.on('connectionLogout', function(connectionInfo) {
  var player = Players.findOne({userId: connectionInfo.userId});
  // If the player who disconnected was in a room, remove them from that room
  if (player.roomId) {
    Meteor.call('removePlayerFromRoom', player.roomId, player);
  }
  console.log('User ' + Meteor.users.findOne(connectionInfo.userId).username + ' disconnected');
});
