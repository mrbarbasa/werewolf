Accounts.onCreateUser(function(options, user) {
  // When a new user signs up, create a player object for that user
  Players.insert(new Player(user.username, user._id), function(err) {
    if (!err) {
      console.log('New player object was created for user ' + user.username);
    }
    else {
      console.log('Could not create a player object for user ' + user.username);
    }
  });

  return user;
});
