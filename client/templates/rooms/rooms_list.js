Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find();
  }
});

Template.roomsList.events({
  'click a.btn': function() {
    Meteor.call('playerJoinRoom', this.name);
  }
});
