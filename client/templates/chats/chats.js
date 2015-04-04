Template.chatBox.helpers({
  messages: function() {
    var currentPlayer = Players.findOne({userId: Meteor.userId()});
    var chat = Chats.findOne({roomId: currentPlayer.roomId});
    return chat ? chat.messages : [];
  },
  notServer: function() {
    return this.sender !== 'SERVER';
  },
  canSeeMessage: function() {
    var currentPlayer = Players.findOne({userId: Meteor.userId()});
    var sender = Players.findOne(this.playerId);
    // Dead players should see all messages
    // Living players should not be able to see dead players' messages
    return !currentPlayer.isAlive || (currentPlayer.isAlive && this.filter === 'LIVING');
  },
  isDefendant: function() {
    var currentPlayer = Players.findOne({userId: Meteor.userId()});
    var room = Rooms.findOne(currentPlayer.roomId);
    var result = 'may-send';
    if (room && room.round === 'DEFENSE') {
      result = currentPlayer._id === room.playerAccusedId ? 'is-defendant' : 'not-defendant';
    }
    return result;
  },
  playerMessageStyle: function() {
    var currentPlayer = Players.findOne({userId: Meteor.userId()});
    if (this.filter === 'LIVING') {
      return 'living-player-message';
    }
    else if (this.filter === 'DEAD') {
      return 'dead-player-message';
    }
  },
  serverMessageStyle: function() {
    if (this.filter === 'SERVER') {
      return 'server-message';
    }
    else if (this.filter === 'DEFENSE') {
      return 'defense-message';
    }
    else if (this.filter === 'ACCUSED') {
      return 'accused-message';
    }
    else if (this.filter === 'INNOCENT') {
      return 'innocent-message';
    }
    else if (this.filter === 'GUILTY') {
      return 'guilty-message';
    }
    else if (this.filter === 'ABSTAINED') {
      return 'abstained-message';
    }
    else if (this.filter === 'KILLED') {
      return 'killed-message';
    }
    else if (this.filter === 'LYNCHED') {
      return 'lynched-message';
    }
  }
});

Template.chatBox.events({
  "click #send-message": function() {
    var message = $('#chat-message').val();
    if (message) {
      var p = Players.findOne({userId: Meteor.userId()});
      var room = Rooms.findOne(p.roomId);
      var maySend = true;
      if (room && room.round === 'DEFENSE') {
        maySend = p._id === room.playerAccusedId ? true : false;
      }
      if (maySend) {
        Meteor.call('sendChatMessage', message, p.isAlive ? 'LIVING' : 'DEAD');
        $('#chat-message').val('');
      }
    }
  },
  "keyup #chat-message": function(e) {
    if (e.keyCode === 13) {
      var message = $('#chat-message').val();
      if (message) {
        var p = Players.findOne({userId: Meteor.userId()});
        var room = Rooms.findOne(p.roomId);
        var maySend = true;
        if (room && room.round === 'DEFENSE') {
          maySend = p._id === room.playerAccusedId ? true : false;
        }
        if (maySend) {
          Meteor.call('sendChatMessage', message, p.isAlive ? 'LIVING' : 'DEAD');
          $('#chat-message').val('');
        }
      }
    }
  }
});
