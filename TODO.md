# TODO: Add PULSE Upgrade

## Plan Overview
- Add new PULSE upgrade with 3 levels (0/3), prices 100,200,300
- Hover text: "A pulse that deals damage outwards."
- Functionality: Circular pulse from player center, expands to map corners, damages enemies in radius
- Levels: 1 damage every 4s, 2 damage every 3s, 3 damage every 2s
- Add to bottom of upgrade panel, resize other buttons to fit

## Tasks
- [x] Add pulse variables to game.js create() method
- [x] Add pulse button to index.html upgrade-window
- [x] Resize upgrade buttons in style.css (reduce padding/font-size)
- [x] Add buyPulse() method in game.js
- [x] Add pulse logic in update() method (timer, expansion, damage)
- [x] Update updateUpgradeButtons() to include pulse button
- [x] Reset pulse variables in restartGame() and resetToMenu()
- [x] Add pulse button event listener in create()
