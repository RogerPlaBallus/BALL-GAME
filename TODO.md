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

# TODO: Add Poison Zone Upgrade

## Overview
Add a new upgrade called POISON ZONE (0/4) that costs the same as lava zones. It behaves identically to lava zones but with a green interior instead of orange-red.

## Tasks
- [x] Add poison zone button to index.html
- [x] Add poison zone variables to game.js
- [x] Add poison zone button event listener in game.js
- [x] Implement buyPoisonZone function in game.js
- [x] Update updateUpgradeButtons to include poison zone
- [x] Add poison zone placement logic in update method
- [x] Add poison zone damage logic in update method - IMPLEMENTED
- [x] Clear poison zones in restartGame
- [x] Reset placingPoisonZone in startLevel
- [ ] Test the poison zone functionality

# TODO: Hide Canvas and Upgrade Window in Menu State

## Overview
When the game is in the 'menu' state (before pressing PLAY), hide the canvas and upgrade window. Show them after pressing PLAY.

## Tasks
- [ ] Set canvas display to 'none' initially in game.js create() method
- [ ] Set upgrade window display to 'none' initially in game.js create() method
- [ ] In startGame() method, set canvas display to 'block' and upgrade window to 'block'
- [ ] Test the visibility changes
