# TODO: Add Dynamic Stats Window Below Audio Controls

## Overview
Add a stats window below the audio controls div displaying Level, Health, Damage, Lasers, and Crit Chance. Stats should update dynamically during gameplay and reset correctly on restart/try again.

## Tasks
- [x] Add stats-window div to index.html below audio-controls
- [x] Add CSS styles for #stats-window in style.css
- [ ] Add statsText element in game.js create() method
- [ ] Update statsText in update() loop alongside HUD updates
- [ ] Reset stats display in restartGame() method
- [ ] Test stats display and dynamic updates
- [ ] Verify reset behavior on restart/try again
