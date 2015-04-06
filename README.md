# Werewolf
A mobile web app game based on Werewolf and Town of Salem.  

Game name pending.  
Development: [werewolf-dev.marifel.io](http://werewolf-dev.marifel.io/)  
Production: [werewolf.marifel.io](http://werewolf.marifel.io/)

### Site is Loading
You might be brought to a page saying that the site is loading.  This is because the app is deployed on Meteor's servers for now.  I plan on using my own server later.

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
- It is very important to sign in as player `one` if you wish to test out this game by yourself.  Only player `one` is assigned as the host to room `Hello`.
- Each round in the development version is only allocated 10 seconds, while the production version has the actual game timer.
- The production version is a work in progress and is not yet production quality.
