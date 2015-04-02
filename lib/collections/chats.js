Chats = new Mongo.Collection('chats');

Chat = function(roomId, roomName) {
  this.roomId = roomId || null;
  this.roomName = roomName || null;
  // Each message is an object with properties sender, message, filter, timestamp
  this.messages = [];
};
