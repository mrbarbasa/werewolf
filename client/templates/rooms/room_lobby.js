// Room Lobby
Template.roomLobby.helpers({
  currentState: function() {
    return Rooms.findOne({name: this.name}).state;
  },
  currentRole: function() {
    return Players.findOne({name: Meteor.user().username}).role;
  },
  // TODO: Commented out for now
  // isPlaying: function() {
  //   return Rooms.findOne({name: this.name}).state === 'PLAYING';
  // },
  isNightPhase: function() {
    return Rooms.findOne({name: this.name}).phase === 'NIGHT';
  },
  isDayPhase: function() {
    return Rooms.findOne({name: this.name}).phase === 'DAY';
  }
});

Template.roomLobby.events({
  'click #leave-room': function() {
    Meteor.call('playerLeaveRoom', this.name);
  },
  'click #game-menu': function() {
    $('#role-villager').toggleClass('hidden');
    $('#role-seer').toggleClass('hidden');
    $('#role-werewolf').toggleClass('hidden');
  }
});


// Players List
Template.playersList.helpers({
  players: function() {
    var players = [];
    Rooms.findOne({name: this.name}).players.forEach(function(p) {
      players.push(Players.findOne(p._id));
    });
    return players;
  },
  playerState: function() {
    return this.isAlive ? 'living-player' : 'dead-player';
  },
  canSeeOtherRoles: function() {
    // Note: this refers to the currently iterated player
    return Players.findOne({name: Meteor.user().username}).role === 'WEREWOLF' && this.role === 'WEREWOLF';
  },
  scannedBySeer: function() {
    return Session.get('scanned_' + this.name) === 'SCANNED';
  },
  scannedRole: function() {
    return this.role === 'WEREWOLF' ? 'WEREWOLF' : 'nope';
  },
  showKillButton: function() {
    var p = Players.findOne({name: Meteor.user().username});
    return p.isAlive && p.role === 'WEREWOLF' && this.role !== 'WEREWOLF';
  },
  showScanButton: function() {
    var p = Players.findOne({name: Meteor.user().username});
    return p.isAlive && p.role === 'SEER' && this.role !== 'SEER' && Session.get('scanned_' + this.name) !== 'SCANNED';
  }
});

Template.playersList.events({
  'click #kill-player': function() {
    Meteor.call('playerKillPlayer', this, function(err, killed) {
      // TODO: Says here it failed but server does indeed kill the player
      // if (!err) {
      //   if (killed) {
      //     console.log('Successfully killed player ' + this.name);
      //   }
      //   else {
      //     console.log('Failed to kill player ' + this.name);
      //   }
      // }
    });
  },
  'click #scan-player': function() {
    Session.set('scanned_' + this.name, 'SCANNED');
  }
});


// Role Villager
Template.roleVillager.helpers({
  villager: function() {
    return "I am a villager";
  }
});


// Role Seer
Template.roleSeer.helpers({
  seer: function() {
    return "I am a seer";
  }
});


// Role Werewolf
Template.roleWerewolf.helpers({
  werewolf: function() {
    return "I am a werewolf";
  }
});
