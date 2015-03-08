Router.configure({
  layoutTemplate: 'layout'
});
Router.route('/', {
  name: 'usersList'
});
Router.route('/roles', {
  name: 'rolesList'
});
