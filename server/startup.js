Meteor.startup(function() {
  // To call these methods: Meteor.call('getServerTime');
  // These methods can be called remotely by clients
  Meteor.methods({
    getServerTime: getServerTime,
    executeUserAction: executeUserAction
  });

  function getServerTime() {
    var timeNow = (new Date()).toTimeString();
    return timeNow;
  }

  function executeUserAction() {
    var gstats = new GlobalStats();
    console.log(Meteor.userId());
    console.log(Meteor.user().username);
    console.log(gstats.numPlayersOnline);
  }

  function GlobalStats() {
    this.numPlayersOnline = Meteor.users.find({'status.online': true}).count();
    this.numPlayersPlaying = 0;
    this.numPlayersWaiting = this.numPlayersOnline - this.numPlayersPlaying;
    this.totalRooms = Rooms.find().count();
    this.numRoomsPlaying = Rooms.find({state: 'PLAYING'}).count();
    this.numRoomsWaiting = Rooms.find({state: 'WAITING'}).count();;
  }
});
