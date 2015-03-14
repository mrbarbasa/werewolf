Meteor.subscribe('users');
Meteor.subscribe('rooms');
Meteor.subscribe('roles');

Template.main.events({
  'click #quick-game': function() {
    console.log('quick game');
  },
  'click #join-game': function() {
    console.log('join game');
  },
  'click #host-game': function() {
    console.log('host game');
  },
  'click #view-profile': function() {
    console.log('view profile');
  },
  'click #game-options': function() {
    console.log('game options');
  }
});
