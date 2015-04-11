Roles = new Mongo.Collection('roles');

Role = function(name, category, team) {
  this.name = name; // VILLAGER, WEREWOLF, SEER
  this.category = category; // VILLAGER, MONSTER
  this.team = team; // GOOD, EVIL
};
