Roles = new Mongo.Collection('roles'); // local browser cache subset of db data

Role = function(name, category, team) {
  this.name = name; // VILLAGER, WEREWOLF, SEER
  this.category = category; // VILLAGER, MONSTER
  this.team = team; // GOOD, BAD
}
