Chats = new Mongo.Collection('chats');

Chat = function(roomId, roomName) {
  this.roomId = roomId || null;
  this.roomName = roomName || null;
  // Each message is an object with properties sender, message, filter, timestamp, playerId
  // Only messages sent by players have playerId; this is undefined for server messages
  this.messages = [];
};
