Template.chatBox.helpers({
  "messages": function() {
    var currentPlayer = Players.findOne({userId: Meteor.userId()});
    var chat = Chats.findOne({roomId: currentPlayer.roomId});
    return chat ? chat.messages : [];
  }
});

Template.chatBox.events({
  "click #send-message": function() {
    var message = $('#chat-message').val();
    if (message) {
      Meteor.call('sendChatMessage', message, 'LIVING');
      $('#chat-message').val('');
    }
  },
  "keyup #chat-message": function(e) {
    if (e.keyCode === 13) {
      var message = $('#chat-message').val();
      if (message) {
        Meteor.call('sendChatMessage', message, 'LIVING');
        $('#chat-message').val('');
      }
    }
  }
});
