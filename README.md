# alfabot

A discord bot to remind students off their online classes by sending them messages with the correct link at the right time.
	
## Technologies
Project is created with:
* sqlite3 version: 5.0.2
* discord.js version: 12.5.1
	
## Setup
To use the bot, install it locally using npm:

```
$ cd ../alfabot
$ npm install
```

then create a secret.json in root directory and replace the placeholders with your bot-token and your discord-id
```
{
  "discord": {
    "secret": "bot-token"
  },
  "static": {
    "owners": ["your-discord-id"]
  }
}
```
now you can start the bot with
```
node .
```
