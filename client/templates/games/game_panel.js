Template.gamePanel.helpers({
  time: function () {
    return Session.get('time');
  }
});

Template.gamePanel.events({
  'click button': function() {
    setInterval(function() {
      Meteor.call('getServerTime', function(err, result) {
        Session.set('time', result);
      });
    }, 1000);

    Meteor.call('executeUserAction');
  }
});
