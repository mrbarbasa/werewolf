chatCollection = new Meteor.Collection(null);

// When an emitted message is received, add it to the collection
chatStream.on('message', function(message) {
  var currentPlayer = Players.findOne({userId: Meteor.userId()});
  var player = Players.findOne({userId: this.userId});
  if (currentPlayer.roomId === player.roomId) {
    chatCollection.insert({
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      message: message
    });
  }
});

Template.chatBox.helpers({
  "messages": function() {
    return chatCollection.find();
  },
  "user": function() {
    if (this.userId == 'me') {
      return "me";
    } else if (this.userId) {
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
    sendMessage();
  },
  "keyup #chat-message": function(e) {
    if (e.keyCode === 13) {
      sendMessage();
    }
  }
});

function sendMessage() {
  var message = $('#chat-message').val();
  chatCollection.insert({
    userId: 'me',
    message: message
  });
  // Emit a message for the receiver to capture
  chatStream.emit('message', message);
  $('#chat-message').val('');
}

function getUsername(id) {
  Meteor.subscribe('user-info', id);
  Tracker.autorun(function() {
    var user = Meteor.users.findOne(id);
    if (user) {
      Session.set('user-' + id, user.username);
    }
  });
}
