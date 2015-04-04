Template.roomHost.events({
  'click #host-game-create': function() {
    var roomName = $('#host-game-name').val();
    Meteor.call('roomCreate', roomName, function(err, result) {
      if (err) {
        return alert('Could not create room');
      }

      Router.go('roomLobby', {
        _id: result._id
      });
    });
  }
});
