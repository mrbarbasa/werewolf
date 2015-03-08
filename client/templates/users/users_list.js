Template.usersList.helpers({
  // Property name users is available to the view
  users: function() {
    return Meteor.users.find({'status.online': true});
  }
});
