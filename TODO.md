# TODO: Change Lava Zone Upgrade to Deployable Circle

## Overview
Modify the lava zone upgrade system to make it a deployable circle, removing all vertical/horizontal options and the pop-up to choose orientation.

## Tasks
- [x] Remove lava orientation popup from HTML (index.html) - Already removed
- [x] Remove lava orientation popup styles from CSS (style.css) - Need to remove leftover styles
- [x] Update buyLavaZone function in game.js to enable direct circle placement - Already implemented
- [x] Modify placement logic in update method for circular zones - Already implemented
- [x] Update lava zone damage check to use circle collision instead of rectangle - Already implemented
- [x] Fix lava zone damage to 1 per second with minimum 1 damage upon entering - IMPLEMENTED
- [ ] Test the new circle placement functionality
