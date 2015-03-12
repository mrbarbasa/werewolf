Meteor.startup(function() {
  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime//,
    // getGame: getGame,
    // getUser: getUser,
    // updateGame: updateGame
  });

  function getServerTime() {
    var timeNow = (new Date()).toTimeString();
    return timeNow;
  }

  // function getGame() {

  // }

  // function getUser() {

  // }

  // function updateGame() {

  // }
});
