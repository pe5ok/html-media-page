# HTMLMediaPage

HTMLMediaPage is a telegram bot written in Javascript for displaying different media content.

## Setup

Register your own Telegram bot via [@BotFather](https://t.me/BotFather). Download full repository from releases. Open `script.js` and change value of variable `TOKEN` with your bot id. Save changes and open html-file.

## How to use

Move the cursor to the bottom of the screen to toggle control panel. Press "start" to enable the bot. Press "clear" to clear the screen. Press "mute" to mute/unmute media. Last button switches access mode for users. 
- "allow all" - all users can send media
- "blocklist" - users from list can't send media
- "allowlist" - only users from list can send media
To add user to list use the text input. To remove user from list hold down username in list.
To add media files to the screen send message with media file to the bot via Telegram. Bot can receive photos, videos, video notes, stickers, GIFs(each file up to 20MB).

## Contributing

No pull requests. Feature requests and bug reports are welcome in issues.

## License

[MIT](https://choosealicense.com/licenses/mit/)