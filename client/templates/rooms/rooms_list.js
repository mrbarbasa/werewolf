Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find();
  }
});
