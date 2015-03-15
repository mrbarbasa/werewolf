Template.roomLobby.events({
  'click #leave-room': function() {
    Meteor.call('playerLeaveRoom', this.name);
  }
});
