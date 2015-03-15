Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find();
  }
});

Template.roomsList.events({
  'click a.btn': function() {
    var roomName = this.name;
    Meteor.call('playerJoinRoom', roomName);
  }
});
