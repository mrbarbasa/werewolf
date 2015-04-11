Router.configure({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound'
});
Router.route('/', {
  name: 'main'
});
Router.route('/rooms', {
  name: 'roomsList'
});
Router.route('/rooms/host', {
  name: 'roomHost'
});
Router.route('/rooms/:_id', {
  name: 'roomLobby',
  data: function() {
    return Rooms.findOne(this.params._id);
  }
});

function requireLogin() {
  if (!Meteor.user()) {
    this.render('accessDenied');
  }
  else {
    this.next();
  }
}

function addReloadWarning() {
  $(window).on('beforeunload', function(e) {
    var message = "Reloading this page will count as if you left this room.  You will be booted out and, if the game is in session, it will count as a suicide.";
    e.returnValue = message;
    return message;
  });
}

function removeReloadWarning() {
  $(window).off('beforeunload');
}

// Show not found template whenever data function returns a falsy object
Router.onBeforeAction('dataNotFound', {
  only: 'roomLobby'
});
Router.onBeforeAction(requireLogin, {
  except: 'main'
});

Router.onAfterAction(addReloadWarning, {
  only: 'roomLobby'
});
Router.onAfterAction(removeReloadWarning, {
  except: 'roomLobby'
});
