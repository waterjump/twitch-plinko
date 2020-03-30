# Twitch Plinko

Interactive Plinko game driven by Twitch chat comments.

## What's Plinko?

Plinko is easily the best game played on American daytime pricing game show The Price is Right.  Have a look: [Plinko on the Price is Right](https://youtu.be/me4SV_tuMSE?t=282)

## How does it work?
This application is built on these key libraries:
* [Matter.js](https://brm.io/matter-js/) is used for the rigid body physics and gravity simulation.
* [p5.js](https://p5js.org/) is used for display and animation.
* [Twitch Messaging Interface (tmi)](https://github.com/tmijs) is used for receiving chat input from Twitch.
* [socket.io](https://socket.io/) is used for relaying Twitch chat meassages to the browser in real-time using websockets.

## Wanna play?
Streams of Twitch Plinko will appear on [my twitch channel](https://www.twitch.tv/hotlava69).  By all means, feel free to raid the channel, haha.

## Installation
1. Clone the repo:
`git clone git@github.com:waterjump/twitch-plinko.git`
2. Navigate to the directory you clone the code into:
`cd twitch-plinko`
3. Install npm packages:
`npm install`
4. Add necessary environment variables.  These are needed to connect to the tmi.
```bash
export BOT_USERNAME=<your twitch user (or bot user) here>
export OAUTH_TOKEN=<the OAuth token provided by Twitch>
export CHANNEL_NAME=<the name of the channel you will stream to>
```
NOTE: You can get a Twitch OAuth token [here](https://twitchapps.com/tmi/).

## Usage
1. Start the server: `npm start`.
2. Visit the page running plinko in a browser: `http://localhost:8081`.
3. Drop a chip.  There are two ways to drop a chip:
  * Make a comment of a slot number on the Twitch chat you are connected to: `1`, `2`, `3`, etc. up through `9`.
  * On the page running the game, pressing keys 1 through 9 will drop a chip in the respective slot as a dummy user.
4. Reloading the page will wipe all previous game data and start a new round.

### Special thanks
* [Dan Shiffman](https://github.com/shiffman) for his great Express/p5/websockets tutorials.
* [Deha](https://www.twitch.tv/misterlooneystuff) for helping me QA and giving me some insights to Twitch features.  Give him a follow!


