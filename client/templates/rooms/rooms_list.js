Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find({state: 'WAITING'});
  }
});

Template.roomsList.events({
  'click a.enter-room': function(e) {
    var r = Rooms.findOne(this._id);
    if (r.players.length === r.maxPlayers) {
      alert('Cannot join a full room');
      e.preventDefault();
    }
    else {
      Meteor.call('playerJoinRoom', r);
    }
  }
});
