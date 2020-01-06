# Chrome Extension Starter Kit


## Structure


### background.js

- Runs on the background all the time
- Common for all windows and tabs


### content.js

- Is injected to every page specified in manifest.json (content_scripts.matches)


### popup.js

- Is run separately for every given page


### options.js

- Runs only in Options page
