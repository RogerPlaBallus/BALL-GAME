# TODO: Add Dynamic Stats Window Below Audio Controls

## Overview
Add a stats window below the audio controls div displaying Level, Health, Damage, Lasers, and Crit Chance. Stats should update dynamically during gameplay and reset correctly on restart/try again. Hide stats window in menu state.

## Tasks
- [x] Add stats-window div to index.html below audio-controls
- [x] Add CSS styles for #stats-window in style.css
- [x] Add statsText element in game.js create() method
- [x] Update statsText in update() loop alongside HUD updates
- [x] Reset stats display in restartGame() method
- [x] Hide stats window in menu state
- [ ] Test stats display and dynamic updates
- [ ] Verify reset behavior on restart/try again
