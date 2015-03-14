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
Router.route('/rooms/:_id', {
  name: 'roomLobby',
  data: function() {
    return Rooms.findOne(this.params._id);
  }
});
Router.route('/users', {
  name: 'usersList'
});
Router.route('/roles', {
  name: 'rolesList'
});

// Show not found template whenever data function returns a falsy object
Router.onBeforeAction('dataNotFound', {
  only: 'roomLobby'
});
