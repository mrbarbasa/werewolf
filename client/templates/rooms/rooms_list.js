Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find();
  }
});

Template.roomsList.events({
  'click a.enter-room': function(e) {
    var r = Rooms.findOne(this._id);
    if (r.state === 'PLAYING' || r.state === 'FINISHED') {
      alert('Cannot join a game in session');
      e.preventDefault();
    }
    else {
      Meteor.call('playerJoinRoom', r);
    }
  }
});
