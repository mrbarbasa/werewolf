Template.roomHost.events({
  'submit form#host-game-form': function(e) {
    e.preventDefault();

    var roomName = $(e.target).find('[name=host-game-name]').val();
    console.log(roomName);
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
