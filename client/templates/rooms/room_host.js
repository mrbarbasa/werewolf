Template.roomHost.events({
  'click #host-game-create': function() {
    var roomName = $('#host-game-name').val();

    if (!roomName) {
      alert('Room name cannot be empty.');
    }
    else if (roomName.length > 20) {
      alert('Room name cannot exceed 20 characters.');
    }
    else {
      Meteor.call('roomCreate', roomName, function(err, result) {
        if (err) {
          return alert('Could not create room.');
        }

        if (result._id) {
          Router.go('roomLobby', {
            _id: result._id
          });
        }
        else {
          alert('Name is already taken.  Please provide a different room name.');
        }
      });
    }
  }
});
