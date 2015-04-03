// Room Lobby
Template.roomLobby.helpers({
  currentState: function() {
    return Rooms.findOne({name: this.name}).state;
  },
  currentRole: function() {
    return Players.findOne({name: Meteor.user().username}).role;
  },
  currentTime: function() {
    return Rooms.findOne(this._id).seconds;
  },
  serverMessage: function() {
    return Rooms.findOne(this._id).message;
  },
  playerAccused: function() {
    var accused = '';
    var p = Players.findOne(Rooms.findOne(this._id).playerAccusedId);
    if (p) {
      accused = p.name;
    }
    return accused;
  },
  canStartGame: function() {
    return Players.findOne({name: Meteor.user().username}).isHost && this.state === 'WAITING' && this.players.length === this.maxPlayers;
  },
  isPlaying: function() {
    return Rooms.findOne({name: this.name}).state === 'PLAYING';
  },
  isNotWaiting: function() {
    return Rooms.findOne({name: this.name}).state !== 'WAITING';
  },
  isFinished: function() {
    return Rooms.findOne({name: this.name}).state === 'FINISHED';
  },
  isNightPhase: function() {
    return Rooms.findOne({name: this.name}).phase === 'NIGHT';
  },
  isDayPhase: function() {
    return Rooms.findOne({name: this.name}).phase === 'DAY';
  },
  isJudgmentRound: function() {
    var p = Players.findOne({name: Meteor.user().username});
    return Rooms.findOne({name: this.name}).round === 'JUDGMENT' && !p.hasVoted && p.isAlive;
  },
  showPlayersList: function() {
    return Session.get('showPlayersList');
  },
  showVoteButtons: function() {
    return Session.get('showVoteButtons');
  }
});

Template.roomLobby.events({
  'click #start-game': function() {
    Meteor.call('startGame', this);
  },
  // TODO: For testing only
  'click #game-cleanup': function() {
    Meteor.call('gameCleanup', this);
  },
  'click .leave-room': function() {
    Meteor.call('playerLeaveRoom', this._id);
  },
  'click .current-role-div': function() {
    $('p.current-role-toggle').toggleClass('hide');
    $('p.current-role-intro').toggleClass('hide');
    $('p#current-role').toggleClass('hide');
  },
  'click #players-tab': function() {
    if (!Session.get('showPlayersList')) {
      Session.set('showPlayersList', true);
      Session.set('showVoteButtons', false);
    }
  },
  'click #chat-tab': function() {
    if (Session.get('showPlayersList')) {
      Session.set('showPlayersList', false);
      Session.set('showVoteButtons', false);
    }
  },
  'click #vote-toggle': function() {
    if (Session.get('showVoteButtons')) {
      Session.set('showVoteButtons', false);
    }
    else {
      Session.set('showVoteButtons', true);
      Session.set('showPlayersList', false);
    }
  },
  'click #vote-yes': function() {
    Meteor.call('voteLynchYes', this);
  },
  'click #vote-no': function() {
    Meteor.call('voteLynchNo', this);
  },
  'click #vote-abstain': function() {
    Meteor.call('voteLynchAbstain', this);
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
    var p = Players.findOne({name: Meteor.user().username});
    // Note: this refers to the currently iterated player
    var werewolvesUnite = p.role === 'WEREWOLF' && this.role === 'WEREWOLF';
    var easyMode = false;
    if (p.roomId) {
      easyMode = Rooms.findOne(p.roomId).mode === 'EASY';
    }
    return (!this.isAlive && easyMode) || werewolvesUnite;
  },
  scannedBySeer: function() {
    var easyMode = false;
    if (this.roomId) {
      easyMode = Rooms.findOne(this.roomId).mode === 'EASY';
    }
    // If easy mode, player has to be alive, else if hard mode, show scanned info regardless
    return ((this.isAlive && easyMode) || !easyMode) && this.hasBeenScanned;
  },
  scannedRole: function() {
    return this.role === 'WEREWOLF' ? 'WEREWOLF' : 'nope';
  },
  showKillButton: function() {
    var p = Players.findOne({name: Meteor.user().username});
    var nightPhase = false;
    var playerKilled = true;
    if (p.roomId) {
      var room = Rooms.findOne(p.roomId);
      if (room) {
        nightPhase = room.phase === 'NIGHT';
        playerKilled = room.playerKilled;
      }
    }
    return p.role === 'WEREWOLF' && p.isAlive && this.isAlive && nightPhase && !playerKilled && this.role !== 'WEREWOLF';
  },
  showScanButton: function() {
    var p = Players.findOne({name: Meteor.user().username});
    var nightPhase = false;
    var playerScanned = true;
    if (p.roomId) {
      var room = Rooms.findOne(p.roomId);
      if (room) {
        nightPhase = room.phase === 'NIGHT';
        playerScanned = room.playerScanned;
      }
    }
    return p.role === 'SEER' && p.isAlive && this.isAlive && nightPhase && !playerScanned && this.role !== 'SEER' && !this.hasBeenScanned;
  },
  isAccused: function() {
    return this.accusedVotes > 0;
  },
  accusedVotes: function() {
    return this.accusedVotes;
  },
  showAccuseButton: function() {
    var p = Players.findOne({name: Meteor.user().username});
    var dayPhase = false;
    var accusationRound = true;
    if (this.roomId) {
      var room = Rooms.findOne(this.roomId);
      if (room) {
        dayPhase = room.phase === 'DAY';
        accusationRound = room.round === 'ACCUSATION';
      }
    }
    return dayPhase && accusationRound && p.isAlive && this.isAlive && p._id !== this._id && p.accusedPlayerId !== this._id;
  },
  suicidalPlayers: function() {
    return Rooms.findOne({name: this.name}).suicidalPlayers;
  },
  isEasyMode: function() {
    var easyMode = false;
    if (this.roomId) {
      easyMode = Rooms.findOne(this.roomId).mode === 'EASY';
    }
    return easyMode
  },
  isRoomHost: function() {
    var r = Rooms.findOne(this.roomId);
    var isRoomHost = false;
    if (r && r.hostPlayerId === this._id && r.state === 'WAITING') {
      isRoomHost = true;
    }
    return isRoomHost;
  }
});

Template.playersList.events({
  'click #kill-player': function() {
    Meteor.call('playerKillPlayer', this);
  },
  'click #scan-player': function() {
    Meteor.call('playerScanPlayer', this);
  },
  'click #accuse-player': function() {
    Meteor.call('playerAccusePlayer', this);
  }
});
