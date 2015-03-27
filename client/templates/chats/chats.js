// Source: https://github.com/arunoda/meteor-streams/blob/master/examples/chat/client/chat.js
chatStream = new Meteor.Stream('chat');
chatCollection = new Meteor.Collection(null);

chatStream.on('chat', function(message) {
  chatCollection.insert({
    userId: this.userId,
    subscriptionId: this.subscriptionId,
    message: message
  });
});

Template.chatBox.helpers({
  "messages": function() {
    return chatCollection.find();
  },
  "user": function() {
    if(this.userId == 'me') {
      return "me";
    } else if(this.userId) {
      var username = Session.get('user-' + this.userId);
      if(username) {
        return username;
      } else {
        getUsername(this.userId);
      }
    } else {
      return this.subscriptionId;
    }
  }
});


var subscribedUsers = {};


Template.chatBox.events({
  "click #send-message": function() {
    var message = $('#chat-message').val();
    chatCollection.insert({
      userId: 'me',
      message: message
    });
    chatStream.emit('chat', message);
    $('#chat-message').val('');
  },
  "keyup #chat-message": function(e) {
    if (e.keyCode === 13) {
      var message = $('#chat-message').val();
      chatCollection.insert({
        userId: 'me',
        message: message
      });
      chatStream.emit('chat', message);
      $('#chat-message').val('');
    }
  }
});

function getUsername(id) {
  Meteor.subscribe('user-info', id);
  Deps.autorun(function() {
    var user = Meteor.users.findOne(id);
    if(user) {
      Session.set('user-' + id, user.username);
    }
  });
}
