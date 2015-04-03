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
  }
});

Template.chatBox.events({
  "click #send-message": function() {
    var message = $('#chat-message').val();
    if (message) {
      var p = Players.findOne({userId: Meteor.userId()});
      Meteor.call('sendChatMessage', message, p.isAlive ? 'LIVING' : 'DEAD');
      $('#chat-message').val('');
    }
  },
  "keyup #chat-message": function(e) {
    if (e.keyCode === 13) {
      var message = $('#chat-message').val();
      if (message) {
        var p = Players.findOne({userId: Meteor.userId()});
        Meteor.call('sendChatMessage', message, p.isAlive ? 'LIVING' : 'DEAD');
        $('#chat-message').val('');
      }
    }
  }
});
