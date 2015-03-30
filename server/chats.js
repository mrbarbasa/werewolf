// Before passing through filters on the server
chatStream.permissions.write(function() {
  return true;
});

// After passing through filters on the server
chatStream.permissions.read(function(eventName) {
  return true;
});
