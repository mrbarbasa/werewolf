# Werewolf
A mobile web app game based on Werewolf and Town of Salem.  

Game name pending.  
Development: [werewolf-dev.marifel.io](http://werewolf-dev.marifel.io/)  
Production: [werewolf.marifel.io](http://werewolf.marifel.io/)

### Site is Loading
You might be brought to a page saying that the site is loading.  This is because the app is deployed on Meteor's servers for now.  I plan on using my own server later.

### Starting Up the Project
1. Install Meteor if you haven't yet: `curl https://install.meteor.com/ | sh`.
2. Fork and clone this repo.
3. In the project directory, type `meteor`.
4. You may see the following Sass error the first time you run the app: `Scss compiler error: undefined` and `file to import not found or unreadable`.  This is due to the `fourseven:scss` Meteor package this project utilizes.  You will just need to press `Ctrl+C` and rerun `meteor` if this happens.

### Currently Supports 8 Players
The game only supports exactly 8 players at this time.  I plan to support 5 to 18 players in a future version.

### How One Person Can Demo This App
1. Visit the development version: [werewolf-dev.marifel.io](http://werewolf-dev.marifel.io/)
2. Sign in with the following credentials: username `one`, password `testing`
3. Open an incognito window and sign in as another player.  Either create a new account or use these credentials: username `two`, password `testing`.
4. While signed in as two different players, as each of them, join the room called `Hello`, which has been prefilled with 6 players.  Note that these players won't take action and simply take up space and roles in a room.
5. The `Start Game` button should appear for player `one`, who has been assigned as the host.  You may now start the game.
6. To clear and stop the game at any point, click on the refresh icon next to the `Chats` link once or twice.  For both players `one` and the other, you will need to exit room `Hello` and then re-enter the room before starting the game again.

### Things to Note
- You must sign in as player `one` if you wish to test out this game by yourself.  Only player `one` is assigned as the host to room `Hello`.
- Each round in the development version is only allocated 10 seconds, while the production version has the actual game timer.
- The production version is a work in progress and is not yet production quality.

### How to Play
You are randomly assigned one of three roles: Villager, Seer, or Werewolf.  In a game of 8 players, there are 5 villagers, 1 seer (on the villagers' team), and 2 werewolves.  The game is played in alternating night and day phases, and the day phase has multiple rounds: discussion, accusation, defense, dusk, judgment, and verdict.

The night phase lasts for 30 seconds.  During the night phase, werewolves may choose one person to kill.  Of the 2 werewolves, whoever is the first to click the kill button will make the single kill for the night (first-come, first-served is not the best implementation for what is supposed to be a team effort and I plan to change it in a future version).  If the night timer runs out before the werewolves make a decision, no one is killed that night.

Also during the night phase, the seer may choose one person to scan.  This action identifies whether or not that person is a werewolf.  Again, if the night timer runs out before the seer makes a decision, no one is scanned that night.

The day phase has the following rounds:

First two rounds:  
- Discussion (90 seconds): Players try to figure out who the werewolves are.
- Accusation (30 seconds): Players vote for who they think is a werewolf.

If someone goes on trial (must have 2 votes):  
- Defense (20 seconds): Player on trial speaks in his or her defense.  No one else can speak at this time.
- Judgment (30 seconds): All players, including the player on trial, gets to vote guilty or innocent.
- Verdict (5 seconds): Message displays, says if player on trial is lynched or not.

If no one receives enough votes to go on trial:  
- Dusk (5 seconds): Message displays, says no one goes on trial.

Werewolves win when there are an equal number of villagers/seer as there are werewolves.  Villagers/seer win when all werewolves are eliminated.



