Chats = new Mongo.Collection('chats');

Chat = function(roomId, roomName) {
  this.roomId = roomId || null;
  this.roomName = roomName || null;
  // Each message is an object with properties _id, sender, message, filter
  // Note that _id for message objects begins at 1 instead of 0
  this.messages = [];
};
