class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.audio('soundtrack', 'sounds/soundtrack.mp3');
        this.load.audio('killsound', 'sounds/killsound.mp3');
        this.load.audio('upgradesound', 'sounds/upgrade-sound.mp3');
        this.load.audio('levelcomplete', 'sounds/level-completed.mp3');
        this.load.audio('takedamageplayer', 'sounds/take-damage-player.mp3');
        this.load.audio('playerwin', 'sounds/player-win.mp3');
        this.load.audio('playerlose', 'sounds/player-lose.mp3');
    }

    create() {
        // Game variables
        this.playerMaxHealth = 5;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.playerDamage = 1;
        this.damageLevel = 0;
        this.healthLevel = 0;
        this.playerCritChance = 0;
        this.moreLasers = false;
        this.moreLasersLevel = 0;
        this.lavaZoneLevel = 0;
        this.lavaZones = [];
        this.placingLavaZone = false;
        this.lavaZonePreview = null;
        this.poisonZoneLevel = 0;
        this.poisonZones = [];
        this.placingPoisonZone = false;
        this.poisonZonePreview = null;
        this.spikesLevel = 0;
        this.spikes = [];
        this.placingSpikes = false;
        this.spikesPreview = null;
        this.pulseLevel = 0;
        this.pulseDamage = 1;
        this.pulseInterval = 4000; // milliseconds between pulses
        this.pulseTimer = 0;
        this.pulseActive = false;
        this.pulseRadius = 0;
        this.pulseMaxRadius = 500; // max radius to cover map corners
        this.pulseGraphics = null;
        this.laserSpeed = 500; // milliseconds between laser damages
        this.level = 1;
        this.maxLevel = 20;
        this.enemiesToSpawn = 10 + (this.level - 1) * 10;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.remainingEnemies = this.enemiesToSpawn;
        this.enemiesPerBatch = this.level;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // 2 seconds between batches
        this.gameStarted = false;
        this.gameOver = false;
        this.levelComplete = false;
        this.paused = false;
        this.laserActive = false;
        this.damageTimer = 0;
        this.playerDamageTimer = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targets = [];
        this.damageTexts = [];
        this.pointerWasDown = false;
        this.lastUpgradeSoundTime = 0;
        this.killSoundPlayed = false;
        this.lastKillSoundTime = 0;
        this.killsoundPool = [];
        this.currentKillSoundIndex = 0;

        // Create lava particle texture
        this.lavaParticleTexture = this.add.graphics();
        this.lavaParticleTexture.fillStyle(0xff4500);
        this.lavaParticleTexture.fillCircle(0, 0, 2);
        this.lavaParticleTexture.generateTexture('lavaParticle');
        this.lavaParticleTexture.destroy();

        // Create poison particle texture
        this.poisonParticleTexture = this.add.graphics();
        this.poisonParticleTexture.fillStyle(0x00ff00);
        this.poisonParticleTexture.fillCircle(0, 0, 2);
        this.poisonParticleTexture.generateTexture('poisonParticle');
        this.poisonParticleTexture.destroy();

        // Get canvas dimensions
        this.canvasWidth = this.game.config.width;
        this.canvasHeight = this.game.config.height;

        // Set canvas background color
        

        // Player (white sphere at center)
        this.player = this.add.graphics();
        this.player.fillStyle(0xffffff);
        this.player.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, 20);

        // Player circle for collision
        this.playerCircle = new Phaser.Geom.Circle(this.canvasWidth / 2, this.canvasHeight / 2, 20);

        // Enemies group
        this.enemies = this.physics.add.group();

        // Laser graphics
        this.lasers = [this.add.graphics()];
        if (this.moreLasers) {
            this.lasers.push(this.add.graphics());
        }

        // Start button
        this.startButton = document.getElementById('start-button');
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

        // Start text
        this.startText = document.getElementById('start-text');

        // Pause button
        this.pauseButton = document.getElementById('pause-button');
        this.pauseButton.addEventListener('click', () => {
            this.togglePause();
        });

        // Restart button
        this.restartButton = document.getElementById('restart-button');
        this.restartButton.style.display = 'none';
        this.restartButton.addEventListener('click', () => {
            this.showRestartConfirm();
        });

        // Restart confirm modal
        this.restartConfirm = document.getElementById('restart-confirm');
        this.restartYesButton = document.getElementById('restart-yes');
        this.restartNoButton = document.getElementById('restart-no');
        this.restartYesButton.addEventListener('click', () => {
            this.restartGame();
            this.resetToMenu();
            this.hideRestartConfirm();
        });
        this.restartNoButton.addEventListener('click', () => {
            this.hideRestartConfirm();
        });

        // Game Over overlay
        this.gameOverText = document.getElementById('game-over');

        // Try Again button
        this.tryAgainButton = document.getElementById('try-again-button');
        this.tryAgainButton.addEventListener('click', () => {
            this.restartGame();
            this.resetToMenu();
        });

        // Level Complete overlay
        this.levelCompleteText = document.getElementById('level-complete');

        // Next Level button
        this.nextLevelButton = document.getElementById('next-level-button');
        this.nextLevelButton.addEventListener('click', () => {
            this.nextLevel();
        });

        // Game Win overlay
        this.gameWinText = document.getElementById('game-win');

        // Game Paused overlay
        this.gamePausedText = document.getElementById('game-paused');

        // Upgrade window
        this.upgradeWindow = document.getElementById('upgrade-window');
        this.upgradeWindow.style.display = 'none';
        this.upgradeText = document.getElementById('upgrade-text');

        // Hide canvas initially
        this.canvas = document.querySelector('#game-container canvas');
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.canvas.style.border = 'none';
            this.canvas.style.backgroundColor = '#000000f0';
        }

        // Damage upgrade button
        this.damageUpgradeButton = document.getElementById('damage-upgrade-button');
        this.damageUpgradeButton.addEventListener('click', () => {
            this.buyDamageUpgrade();
        });

        // More lasers upgrade button
        this.moreLasersButton = document.getElementById('more-lasers-button');
        this.moreLasersButton.addEventListener('click', () => {
            this.buyMoreLasers();
        });

        // Health upgrade button
        this.healthUpgradeButton = document.getElementById('health-upgrade-button');
        this.healthUpgradeButton.addEventListener('click', () => {
            this.buyHealthUpgrade();
        });

        // Lava zone upgrade button
        this.lavaZoneButton = document.getElementById('lava-zone-button');
        this.lavaZoneButton.addEventListener('click', () => {
            this.buyLavaZone();
        });

        // Poison zone upgrade button
        this.poisonZoneButton = document.getElementById('poison-zone-button');
        this.poisonZoneButton.addEventListener('click', () => {
            this.buyPoisonZone();
        });

        // Spikes upgrade button
        this.spikesButton = document.getElementById('spikes-button');
        this.spikesButton.addEventListener('click', () => {
            this.buySpikes();
        });

        // Pulse upgrade button
        this.pulseButton = document.getElementById('pulse-button');
        this.pulseButton.addEventListener('click', () => {
            this.buyPulse();
        });

        // Stats elements
        this.statsLevel = document.getElementById('stats-level');
        this.statsHealth = document.getElementById('stats-health');
        this.statsDamage = document.getElementById('stats-damage');
        this.statsLasers = document.getElementById('stats-lasers');
        this.statsCrit = document.getElementById('stats-crit');

        // HUD elements
        this.hudLevel = document.getElementById('hud-level');
        this.hudEnemies = document.getElementById('hud-enemies');

        // Stats elements
        this.statsMoney = document.getElementById('stats-money');

        // Crit message text (inside canvas)
        this.critMessage = this.add.text(this.canvasWidth / 2, this.canvasHeight / 2 - 150, '', { fontSize: '48px', fill: '#ffff00', fontStyle: 'bold' });
        this.critMessage.setOrigin(0.5);
        this.critMessage.setVisible(false);



        // Physics overlaps handled in update

        // Audio setup
        this.soundtrack = this.sound.add('soundtrack', { loop: true, volume: 0.1 });
        // Create sound pool for killsound to handle multiple concurrent plays
        for (let i = 0; i < 10; i++) {
            this.killsoundPool.push(this.sound.add('killsound', { volume: 0.1 }));
        }
        this.upgradesound = this.sound.add('upgradesound', { volume: 0.05 });
        this.levelcompleteSound = this.sound.add('levelcomplete', { volume: 0.1 });
        this.takedamageplayerSound = this.sound.add('takedamageplayer', { volume: 0.1 });
        this.playerwinSound = this.sound.add('playerwin', { volume: 1 });
        this.playerloseSound = this.sound.add('playerlose', { volume: 1 });

        // Store base volumes for volume controls
        this.baseVolumes = {
            soundtrack: 0.1,
            killsound: 0.1,
            upgradesound: 0.05,
            levelcomplete: 0.1,
            takedamageplayer: 0.1,
            playerwin: 1,
            playerlose: 1
        };
        
        this.levelCompleteSoundPlayed = false;
        this.playerWinSoundPlayed = false;
        this.playerLoseSoundPlayed = false;

        // Volume controls
        const musicVolumeSlider = document.getElementById('music-volume');
        const effectsVolumeSlider = document.getElementById('effects-volume');
        musicVolumeSlider.addEventListener('input', () => {
            this.soundtrack.setVolume(musicVolumeSlider.value * 0.1);
        });
        effectsVolumeSlider.addEventListener('input', () => {
            this.killsoundPool.forEach(sound => sound.setVolume(this.baseVolumes.killsound * effectsVolumeSlider.value));
            this.upgradesound.setVolume(this.baseVolumes.upgradesound * effectsVolumeSlider.value);
            this.levelcompleteSound.setVolume(this.baseVolumes.levelcomplete * effectsVolumeSlider.value);
            this.takedamageplayerSound.setVolume(this.baseVolumes.takedamageplayer * effectsVolumeSlider.value);
            this.playerwinSound.setVolume(this.baseVolumes.playerwin * effectsVolumeSlider.value);
            this.playerloseSound.setVolume(this.baseVolumes.playerlose * effectsVolumeSlider.value);
        });

        // Play soundtrack on page load
        this.soundtrack.play();

        // Auto-player: no manual input needed
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver || (this.levelComplete && !this.placingLavaZone && !this.placingPoisonZone && !this.placingSpikes) || this.paused) return;

        // Move enemies towards player
        this.enemies.children.entries.forEach(enemy => {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.canvasWidth / 2, this.canvasHeight / 2);
            let baseSpeed;
            if (this.level <= 10) {
                baseSpeed = 50;
            } else if (this.level <= 15) {
                baseSpeed = 60;
            } else {
                baseSpeed = 70;
            }
            const speed = baseSpeed * (1 + (this.level - 1) * 0.02);
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            // Update graphics position
            enemy.graphics.setPosition(enemy.x, enemy.y);
            // Update damage text position if it exists
            if (enemy.damageText) {
                enemy.damageText.setPosition(enemy.x + 20, enemy.y - 25);
            }
        });

        // Auto-targeting: find targets for lasers
        if (this.enemies.children.entries.length > 0) {
            this.targets = [];
            const playerX = this.canvasWidth / 2;
            const playerY = this.canvasHeight / 2;
            // Sort enemies by distance
            const sortedEnemies = this.enemies.children.entries.sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(playerX, playerY, a.x, a.y);
                const distB = Phaser.Math.Distance.Between(playerX, playerY, b.x, b.y);
                return distA - distB;
            });
            // Target up to the number of lasers available
            const numLasers = this.moreLasersLevel + 1;
            for (let i = 0; i < Math.min(numLasers, sortedEnemies.length); i++) {
                this.targets.push({ x: sortedEnemies[i].x, y: sortedEnemies[i].y });
            }
            this.laserActive = this.targets.length > 0;
        } else {
            this.laserActive = false;
            this.lasers.forEach(laser => laser.clear());
            this.targets = [];
        }

        // Handle laser
        if (this.laserActive) {
            this.drawLaser();

            // Check laser hits
            this.damageTimer += delta;
            if (this.damageTimer >= this.laserSpeed) {
                this.killSoundPlayed = false;
                let enemyNearDeath = false;
                this.targets.forEach((target, index) => {
                    this.enemies.children.entries.forEach(enemy => {
                        if (this.checkLaserHit(target.x, target.y, enemy)) {
                            let damage = this.playerDamage;
                            const isCrit = Math.random() < this.playerCritChance / 100;
                            if (isCrit) {
                                damage *= 2;
                            }
                            enemy.damageTaken += damage;
                            enemy.health -= damage;
                            if (enemy.damageText) {
                                enemy.damageText.setText("-" + enemy.damageTaken);
                            } else {
                                enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '20px', fill: '#ff0000' });
                            }
                            if (enemy.health <= 0) {
                                enemyNearDeath = true;
                                if (enemy.damageText) { enemy.damageText.destroy(); }
                                enemy.graphics.destroy();
                                enemy.destroy();
                                this.enemiesAlive--;
                                this.remainingEnemies--;
                                this.playerMoney++;
                            }
                        }
                    });
                });
                if (enemyNearDeath && !this.killSoundPlayed) {
                    this.killsoundPool[this.currentKillSoundIndex].play({ rate: 1.0 });
                    this.currentKillSoundIndex = (this.currentKillSoundIndex + 1) % this.killsoundPool.length;
                    this.killSoundPlayed = true;
                }
                this.damageTimer = 0;
            }
        }

        // Check player damage
        let playerDamaged = false;
        this.enemies.children.entries.forEach(enemy => {
            const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
            if (Phaser.Geom.Intersects.CircleToCircle(this.playerCircle, enemyCircle)) {
                playerDamaged = true;
            }
        });
        if (playerDamaged) {
            this.playerDamageTimer += delta;
            if (this.playerDamageTimer >= 1000) { // 1 damage per second
                this.playerHealth -= 1;
                this.takedamageplayerSound.play();
                this.playerDamageTimer = 0;
            }
        } else {
            this.playerDamageTimer = 0;
        }

        // Spawn enemies in batches
        if (this.enemiesSpawned < this.enemiesToSpawn) {
            this.spawnTimer += delta;
            if (this.spawnTimer >= this.spawnInterval) {
                const enemiesToSpawnNow = Math.min(this.enemiesPerBatch, this.enemiesToSpawn - this.enemiesSpawned);
                for (let i = 0; i < enemiesToSpawnNow; i++) {
                    this.spawnEnemy();
                }
                this.spawnTimer = 0;
            }
        }

        // Update HUD
        if (this.hudLevel) this.hudLevel.textContent = this.level;
        if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;

        // Update stats
        if (this.statsLevel) this.statsLevel.textContent = this.level;
        if (this.statsHealth) this.statsHealth.textContent = this.playerHealth;
        if (this.statsDamage) this.statsDamage.textContent = this.playerDamage;
        if (this.statsLasers) this.statsLasers.textContent = this.moreLasersLevel + 1;
        if (this.statsCrit) this.statsCrit.textContent = this.playerCritChance + '%';
        if (this.statsMoney) this.statsMoney.textContent = this.playerMoney;

        // Update upgrade buttons
        this.updateUpgradeButtons();

        // Check level complete
        if (this.enemiesAlive === 0 && this.enemiesSpawned === this.enemiesToSpawn) {
            this.levelComplete = true;
            this.physics.pause();
            // Clear lasers when level ends
            this.lasers.forEach(laser => laser.clear());
            // Play level complete sound once
            if (!this.levelCompleteSoundPlayed) {
                this.levelcompleteSound.play();
                this.levelCompleteSoundPlayed = true;
            }
            // Play player win sound on level 20 after 1 second
            if (this.level === 20 && !this.playerWinSoundPlayed) {
                this.time.delayedCall(2000, () => {
                    this.playerwinSound.play();
                    this.playerWinSoundPlayed = true;
                });
            }
            // Check for crit chance upgrade at levels 5, 10, 15
            if (this.level % 5 === 0 && this.level <= 15) {
                const maxCritChance = Math.floor(this.level / 5) * 10;
                if (this.playerCritChance < maxCritChance) {
                    this.playerCritChance = maxCritChance;
                    this.critMessage.setText('Crit Chance +10%');
                    this.critMessage.setVisible(true);
                    this.time.delayedCall(5000, () => {
                        this.critMessage.setVisible(false);
                    });
                }
            }
            if (this.level === this.maxLevel) {
                this.gameWinText.style.display = 'block';
            } else {
                this.levelCompleteText.style.display = 'block';
                this.nextLevelButton.style.display = 'block';
            }
        }

        // Handle lava zone placement
        if (this.placingLavaZone) {
            const pointer = this.input.activePointer;
            // Update preview position to follow mouse
            if (this.lavaZonePreview) {
                this.lavaZonePreview.setPosition(pointer.worldX, pointer.worldY);
            }
            // Place zone on click
            if (pointer.isDown && this.lavaZonePreview) {
                const x = pointer.worldX;
                const y = pointer.worldY;
                const zone = this.add.graphics();
                zone.fillStyle(0xff4500, 0.7); // orange red
                zone.fillCircle(x, y, 50);
                // Add particle emitter for bubbling lava effect
                const emitter = this.add.particles(x, y, 'lavaParticle', {
                    speed: { min: 10, max: 50 },
                    scale: { start: 0.5, end: 0 },
                    lifespan: 1000,
                    frequency: 100,
                    quantity: 2,
                    emitting: true
                });
                // Add glow for heat effect
                const glow = this.add.graphics();
                glow.fillStyle(0xff4500, 0.3);
                glow.fillCircle(x, y, 60);
                // Animate glow for flickering heat effect
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 0.3, to: 0.5 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
                // Add inner wave effect
                const innerWave = this.add.graphics();
                innerWave.fillStyle(0xff4500, 0.4);
                innerWave.fillCircle(0, 0, 20);
                innerWave.setPosition(x, y);
                // Animate inner wave for movement effect: starts small, grows to circle size, shrinks back
                this.tweens.add({
                    targets: innerWave,
                    scaleX: { from: 0.1, to: 2.0 },
                    scaleY: { from: 0.1, to: 2.0 },
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.lavaZones.push({ x, y, radius: 50, graphics: zone, emitter, glow, innerWave });
                this.lavaZonePreview.destroy();
                this.lavaZonePreview = null;
                this.placingLavaZone = false;
                this.upgradeText.textContent = 'Lava zone placed!';
                this.time.delayedCall(2000, () => {
                    this.upgradeText.textContent = '';
                });
            }
        }

        // Handle poison zone placement
        if (this.placingPoisonZone) {
            const pointer = this.input.activePointer;
            // Update preview position to follow mouse
            if (this.poisonZonePreview) {
                this.poisonZonePreview.setPosition(pointer.worldX, pointer.worldY);
            }
            // Place zone on click
            if (pointer.isDown && this.poisonZonePreview) {
                const x = pointer.worldX;
                const y = pointer.worldY;
                const zone = this.add.graphics();
                zone.fillStyle(0x00ff00, 0.7); // green
                zone.fillCircle(x, y, 50);
                // Add particle emitter for bubbling poison effect
                const emitter = this.add.particles(x, y, 'poisonParticle', {
                    speed: { min: 10, max: 50 },
                    scale: { start: 0.5, end: 0 },
                    lifespan: 1000,
                    frequency: 100,
                    quantity: 2,
                    emitting: true
                });
                // Add glow for toxic effect
                const glow = this.add.graphics();
                glow.fillStyle(0x00ff00, 0.3);
                glow.fillCircle(x, y, 60);
                // Animate glow for flickering toxic effect
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 0.3, to: 0.5 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
                // Add inner wave effect
                const innerWave = this.add.graphics();
                innerWave.fillStyle(0x00ff00, 0.4);
                innerWave.fillCircle(0, 0, 20);
                innerWave.setPosition(x, y);
                // Animate inner wave for movement effect: starts small, grows to circle size, shrinks back
                this.tweens.add({
                    targets: innerWave,
                    scaleX: { from: 0.1, to: 2.0 },
                    scaleY: { from: 0.1, to: 2.0 },
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.poisonZones.push({ x, y, radius: 50, graphics: zone, emitter, glow, innerWave });
                this.poisonZonePreview.destroy();
                this.poisonZonePreview = null;
                this.placingPoisonZone = false;
                this.upgradeText.textContent = 'Poison zone placed!';
                this.time.delayedCall(2000, () => {
                    this.upgradeText.textContent = '';
                });
            }
        }

        // Handle spikes placement
        if (this.placingSpikes) {
            const pointer = this.input.activePointer;
            // Update preview position to follow mouse
            if (this.spikesPreview) {
                this.spikesPreview.setPosition(pointer.worldX, pointer.worldY);
            }
            // Place spikes on click
            if (!this.pointerWasDown && pointer.isDown && this.spikesPreview) {
                const x = pointer.worldX;
                const y = pointer.worldY;
                const spike = this.add.graphics();
                spike.fillStyle(0x808080, 0.7); // grey
                spike.fillCircle(x, y, 15);
                // Add inner wave effect
                const innerWave = this.add.graphics();
                innerWave.fillStyle(0x808080, 0.4);
                innerWave.fillCircle(0, 0, 7);
                innerWave.setPosition(x, y);
                // Animate inner wave for movement effect: starts small, grows to circle size, shrinks back
                this.tweens.add({
                    targets: innerWave,
                    scaleX: { from: 0.1, to: 2.0 },
                    scaleY: { from: 0.1, to: 2.0 },
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.spikes.push({ x, y, radius: 15, graphics: spike, innerWave, damagedEnemies: new Set() });
                this.spikesPreview.destroy();
                this.spikesPreview = null;
                this.placingSpikes = false;
                this.upgradeText.textContent = 'Spikes placed!';
                this.time.delayedCall(2000, () => {
                    this.upgradeText.textContent = '';
                });
            }
        }

        // Lava zone damage
        this.lavaZones.forEach(zone => {
            this.enemies.children.entries.forEach(enemy => {
                const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
                const zoneCircle = new Phaser.Geom.Circle(zone.x, zone.y, zone.radius);
                if (Phaser.Geom.Intersects.CircleToCircle(enemyCircle, zoneCircle)) {
                    if (!enemy.lastLavaDamage) {
                        enemy.lastLavaDamage = 0;
                    }
                    const currentTime = this.time.now;
                    if (currentTime - enemy.lastLavaDamage >= 1000) { // 1 damage per second
                        enemy.damageTaken += 1;
                        enemy.health -= 1;
                        enemy.lastLavaDamage = currentTime;
                        if (enemy.damageText) {
                            enemy.damageText.setText("-" + enemy.damageTaken);
                        } else {
                            enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '24px', fill: '#ff0000' });
                        }
                        if (enemy.health <= 0) {
                            if (enemy.damageText) { enemy.damageText.destroy(); }
                            enemy.graphics.destroy();
                            enemy.destroy();
                            this.enemiesAlive--;
                            this.remainingEnemies--;
                            this.playerMoney++;
                        }
                    }
                }
            });
        });

        // Poison zone damage
        this.poisonZones.forEach(zone => {
            this.enemies.children.entries.forEach(enemy => {
                const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
                const zoneCircle = new Phaser.Geom.Circle(zone.x, zone.y, zone.radius);
                if (Phaser.Geom.Intersects.CircleToCircle(enemyCircle, zoneCircle)) {
                    if (!enemy.lastPoisonDamage) {
                        enemy.lastPoisonDamage = 0;
                    }
                    const currentTime = this.time.now;
                    if (currentTime - enemy.lastPoisonDamage >= 1000) { // 1 damage per second
                        enemy.damageTaken += 1;
                        enemy.health -= 1;
                        enemy.lastPoisonDamage = currentTime;
                        if (enemy.damageText) {
                            enemy.damageText.setText("-" + enemy.damageTaken);
                        } else {
                            enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '24px', fill: '#ff0000' });
                        }
                        if (enemy.health <= 0) {
                            if (enemy.damageText) { enemy.damageText.destroy(); }
                            enemy.graphics.destroy();
                            enemy.destroy();
                            this.enemiesAlive--;
                            this.remainingEnemies--;
                            this.playerMoney++;
                        }
                    }
                }
            });
        });

        // Spikes damage
        this.spikes.forEach(spike => {
            this.enemies.children.entries.forEach(enemy => {
                const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 15);
                const spikeCircle = new Phaser.Geom.Circle(spike.x, spike.y, spike.radius);
                if (Phaser.Geom.Intersects.CircleToCircle(enemyCircle, spikeCircle)) {
                    if (!spike.damagedEnemies.has(enemy)) {
                        spike.damagedEnemies.add(enemy);
                        enemy.damageTaken += 5;
                        enemy.health -= 5;
                        if (enemy.damageText) {
                            enemy.damageText.setText("-" + enemy.damageTaken);
                        } else {
                            enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '24px', fill: '#ff0000' });
                        }
                        if (enemy.health <= 0) {
                            if (enemy.damageText) { enemy.damageText.destroy(); }
                            enemy.graphics.destroy();
                            enemy.destroy();
                            this.enemiesAlive--;
                            this.remainingEnemies--;
                            this.playerMoney++;
                        }
                    }
                }
            });
        });

        // Pulse damage
        if (this.pulseLevel > 0) {
            this.pulseTimer += delta;
            if (this.pulseTimer >= this.pulseInterval) {
                this.pulseActive = true;
                this.pulseRadius = 0;
                this.pulseGraphics = this.add.graphics();
                this.pulseGraphics.fillStyle(0xffffff, 0.3); // transparent white
                this.pulseGraphics.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, 0);
                this.pulseTimer = 0;
            }
            if (this.pulseActive) {
                this.pulseRadius += delta * 0.5; //  speed
                if (this.pulseGraphics) {
                    this.pulseGraphics.clear();
                    this.pulseGraphics.fillStyle(0xffffff, 0.3);
                    this.pulseGraphics.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, this.pulseRadius);
                }
                // Damage enemies in radius
                this.enemies.children.entries.forEach(enemy => {
                    const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
                    const pulseCircle = new Phaser.Geom.Circle(this.canvasWidth / 2, this.canvasHeight / 2, this.pulseRadius);
                    if (Phaser.Geom.Intersects.CircleToCircle(enemyCircle, pulseCircle)) {
                        if (!enemy.lastPulseDamage) {
                            enemy.lastPulseDamage = 0;
                        }
                        const currentTime = this.time.now;
                        if (currentTime - enemy.lastPulseDamage >= 500) { // damage every 500ms during pulse
                            enemy.lastPulseDamage = currentTime;
                            enemy.damageTaken += this.pulseDamage;
                            enemy.health -= this.pulseDamage;
                            if (enemy.damageText) {
                                enemy.damageText.setText("-" + enemy.damageTaken);
                            } else {
                                enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '24px', fill: '#ff0000' });
                            }
                            if (enemy.health <= 0) {
                                if (enemy.damageText) { enemy.damageText.destroy(); }
                                enemy.graphics.destroy();
                                enemy.destroy();
                                this.enemiesAlive--;
                                this.remainingEnemies--;
                                this.playerMoney++;
                            }
                        }
                    }
                });
                if (this.pulseRadius >= this.pulseMaxRadius) {
                    this.pulseActive = false;
                    if (this.pulseGraphics) {
                        this.pulseGraphics.destroy();
                        this.pulseGraphics = null;
                    }
                }
            }
        }

        // Check game over
        if (this.playerHealth <= 0) {
            this.gameOver = true;
            this.gameOverText.style.display = 'block';
            this.tryAgainButton.style.display = 'block';
            this.physics.pause();
            // Play player lose sound once
            if (!this.playerLoseSoundPlayed) {
                this.playerloseSound.play();
                this.playerLoseSoundPlayed = true;
            }
            // Clear poison zones on game over
            this.poisonZones.forEach(zone => {
                if (zone.emitter) zone.emitter.destroy();
                if (zone.glow) zone.glow.destroy();
                if (zone.innerWave) zone.innerWave.destroy();
                zone.graphics.destroy();
            });
            this.poisonZones = [];
            // Clear spikes on game over
            this.spikes.forEach(spike => {
                if (spike.innerWave) spike.innerWave.destroy();
                spike.graphics.destroy();
            });
            this.spikes = [];
        }
    }

    startGame() {
        this.gameStarted = true;
        this.startButton.style.display = 'none';
        this.startText.style.display = 'none';
        this.pauseButton.style.display = 'block';
        this.restartButton.style.display = 'block';
        // Show canvas, upgrade window, and stats window
        if (this.canvas) {
            this.canvas.style.display = 'block';
            this.canvas.style.border = '1px solid #fff';
            this.canvas.style.backgroundColor = 'transparent';
        }
        this.upgradeWindow.style.display = 'block';
        document.getElementById('stats-window').style.display = 'flex';
        document.getElementById('hud-window').style.display = 'flex';
        document.getElementById('audio-controls').style.display = 'flex';
        this.startLevel();
    }

    startLevel() {
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.remainingEnemies = this.enemiesToSpawn;
        this.levelComplete = false;
        this.paused = false;
        this.spawnTimer = 0;
        this.levelCompleteSoundPlayed = false;
        this.playerWinSoundPlayed = false;
        this.killSoundPlayed = false;
        // Clear any remaining enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.damageText) { enemy.damageText.destroy(); }
            enemy.graphics.destroy();
            enemy.destroy();
        });
        this.enemies.clear();

        // Reset lava zone placement state
        if (this.lavaZonePreview) {
            this.lavaZonePreview.destroy();
            this.lavaZonePreview = null;
        }
        this.placingLavaZone = false;

        // Reset poison zone placement state
        if (this.poisonZonePreview) {
            this.poisonZonePreview.destroy();
            this.poisonZonePreview = null;
        }
        this.placingPoisonZone = false;

        // Reset spikes placement state
        if (this.spikesPreview) {
            this.spikesPreview.destroy();
            this.spikesPreview = null;
        }
        this.placingSpikes = false;

        // Hide overlays
        this.levelCompleteText.style.display = 'none';
        this.nextLevelButton.style.display = 'none';
        this.gameWinText.style.display = 'none';
        this.gamePausedText.style.display = 'none';
        // Resume physics
        this.physics.resume();
    }

    restartGame() {
        // Clear enemies
        const enemiesToDestroy = [...this.enemies.children.entries];
        enemiesToDestroy.forEach(enemy => {
            if (enemy.damageText) enemy.damageText.destroy();
            if (enemy.graphics) enemy.graphics.destroy();
            enemy.destroy();
        });
        this.enemies.clear();

        // Clear lava zones
        this.lavaZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) zone.glow.destroy();
            if (zone.innerWave) zone.innerWave.destroy();
            zone.graphics.destroy();
        });
        // Clear poison zones
        this.poisonZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) zone.glow.destroy();
            if (zone.innerWave) zone.innerWave.destroy();
            zone.graphics.destroy();
        });
        // Clear spikes
        this.spikes.forEach(spike => {
            if (spike.innerWave) spike.innerWave.destroy();
            spike.graphics.destroy();
        });

        // Clear lasers
        this.lasers.forEach(laser => laser.clear());

        // Reset game variables
        this.playerMaxHealth = 5;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.playerDamage = 1;
        this.damageLevel = 0;
        this.healthLevel = 0;
        this.playerCritChance = 0;
        this.moreLasers = false;
        this.moreLasersLevel = 0;
        this.lavaZoneLevel = 0;
        this.lavaZones = [];
        this.placingLavaZone = false;
        this.poisonZoneLevel = 0;
        this.poisonZones = [];
        this.placingPoisonZone = false;
        this.spikesLevel = 0;
        this.spikes = [];
        this.placingSpikes = false;
        this.pulseLevel = 0;
        this.pulseDamage = 1;
        this.pulseInterval = 4000;
        this.pulseTimer = 0;
        this.pulseActive = false;
        this.pulseRadius = 0;
        this.pulseGraphics = null;
        this.level = 1;
        this.enemiesToSpawn = 10;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.remainingEnemies = this.enemiesToSpawn;
        this.enemiesPerBatch = 1;
        this.spawnInterval = 2000;
        this.gameOver = false;
        this.laserActive = false;
        this.damageTimer = 0;
        this.playerDamageTimer = 0;
        this.playerLoseSoundPlayed = false;
        this.levelCompleteSoundPlayed = false;
        this.playerWinSoundPlayed = false;
        this.killSoundPlayed = false;

        // Hide overlays
        this.gameOverText.style.display = 'none';
        this.tryAgainButton.style.display = 'none';

        this.lasers = [this.add.graphics()];

        // Update HUD
        if (this.hudLevel) this.hudLevel.textContent = this.level;
        if (this.hudHealth) this.hudHealth.textContent = this.playerHealth;
        if (this.hudMoney) this.hudMoney.textContent = this.playerMoney;
        if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;

        // Reset stats
        if (this.statsLevel) this.statsLevel.textContent = this.level;
        if (this.statsHealth) this.statsHealth.textContent = this.playerHealth;
        if (this.statsDamage) this.statsDamage.textContent = this.playerDamage;
        if (this.statsLasers) this.statsLasers.textContent = this.moreLasersLevel + 1;
        if (this.statsCrit) this.statsCrit.textContent = '0%';

        // Resume physics
        this.physics.resume();
    }

    spawnEnemy() {
        // Spawn outside screen from random direction
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        switch (side) {
            case 0: // top
                x = Phaser.Math.Between(0, this.canvasWidth);
                y = -20;
                break;
            case 1: // right
                x = this.canvasWidth + 20;
                y = Phaser.Math.Between(0, this.canvasHeight);
                break;
            case 2: // bottom
                x = Phaser.Math.Between(0, this.canvasWidth);
                y = this.canvasHeight + 20;
                break;
            case 3: // left
                x = -20;
                y = Phaser.Math.Between(0, this.canvasHeight);
                break;
        }

        const enemy = this.enemies.create(x, y, null);
        enemy.body.debugShowFill = false;
        enemy.body.debugShowStroke = false;
        enemy.setCircle(16);

        // Set enemy health based on level
        if (this.level <= 4) {
            enemy.health = 5;
        } else if (this.level <= 9) {
            enemy.health = 7;
        } else if (this.level <= 14) {
            enemy.health = 10;
        } else {
            enemy.health = 15;
        }
        enemy.damageTaken = 0;
        enemy.lastSpikeDamage = 0;
        enemy.lastLavaDamage = 0;
        enemy.lastPoisonDamage = 0;
        enemy.lastPulseDamage = 0;
        enemy.setCollideWorldBounds(false);

        // Add graphics for enemy
        enemy.graphics = this.add.graphics();
        enemy.graphics.fillStyle(0xff0000);
        enemy.graphics.fillCircle(0, 0, 24);
        enemy.graphics.setPosition(x, y);

        this.enemiesSpawned++;
        this.enemiesAlive++;

        
    }

    drawLaser() {
        const laserColors = [0xffffff, 0xffff00, 0x0000ff, 0xff00ff, 0x00ff00, 0xff0000]; // white, yellow, blue, pink, green, red
        this.lasers.forEach((laser, index) => {
            if (index < this.targets.length) {
                laser.clear();
                const color = laserColors[index] || 0xff0000; // use color based on index, fallback to red
                const playerX = this.canvasWidth / 2;
                const playerY = this.canvasHeight / 2;
                const targetX = this.targets[index].x;
                const targetY = this.targets[index].y;

                // Draw sharp, high-quality laser with solid core and minimal glow
                // Solid core for sharpness
                laser.lineStyle(3, color, 1);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                // Outer glow layer
                laser.lineStyle(8, color, 0.4);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                // Subtle outer glow
                laser.lineStyle(12, color, 0.2);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();
            } else {
                laser.clear();
            }
        });
    }

    checkLaserHit(mouseX, mouseY, enemy) {
        const line = new Phaser.Geom.Line(this.canvasWidth / 2, this.canvasHeight / 2, mouseX, mouseY);
        const circle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
        return Phaser.Geom.Intersects.LineToCircle(line, circle);
    }

    nextLevel() {
        this.level++;
        this.enemiesToSpawn = 10 + (this.level - 1) * 10;
        this.enemiesPerBatch = this.level;
        this.spawnInterval = this.level >= 2 ? 1500 : 2000 * Math.pow(2, this.level - 1);
        this.playerHealth = this.playerMaxHealth; // Reset health to max at start of new level
        this.startLevel();
    }

    playerHit(player, enemy) {
        // Damage player
        this.playerHealth -= 1;
    }

    buyDamageUpgrade() {
        const costs = [10, 20, 50, 100, 300];
        if (this.damageLevel < 5 && this.playerMoney >= costs[this.damageLevel]) {
            this.playerMoney -= costs[this.damageLevel];
            this.damageLevel++;
            this.playerDamage = 1 + this.damageLevel;
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `Damage upgraded! Now level ${this.damageLevel}/5.`;
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }

    buyMoreLasers() {
        const costs = [10, 20, 100, 300];
        if (this.moreLasersLevel < 4 && this.playerMoney >= costs[this.moreLasersLevel]) {
            this.playerMoney -= costs[this.moreLasersLevel];
            this.moreLasersLevel++;
            this.moreLasers = true;
            this.lasers.push(this.add.graphics());
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `More lasers upgraded! Now ${this.moreLasersLevel + 1} lasers.`;
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Update stats immediately
            if (this.statsLasers) this.statsLasers.textContent = this.moreLasersLevel + 1;
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }

    buyHealthUpgrade() {
        const costs = [15, 20, 50];
        const healthValues = [5, 10, 15, 20];
        if (this.healthLevel < 3 && this.playerMoney >= costs[this.healthLevel]) {
            this.playerMoney -= costs[this.healthLevel];
            this.healthLevel++;
            this.playerMaxHealth = healthValues[this.healthLevel];
            this.playerHealth = this.playerMaxHealth; // Reset current health to new max
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `Health upgraded! Now level ${this.healthLevel}/3.`;
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }

    buyLavaZone() {
        const costs = [10, 15, 20, 25];
        if (this.lavaZoneLevel < 4 && this.playerMoney >= costs[this.lavaZoneLevel]) {
            this.playerMoney -= costs[this.lavaZoneLevel];
            this.lavaZoneLevel++;
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.placingLavaZone = true;
            this.lavaZonePreview = this.add.graphics();
            this.lavaZonePreview.fillStyle(0xff4500, 0.5); // orange red
            this.lavaZonePreview.fillCircle(0, 0, 50);
            this.upgradeText.textContent = 'Click to place lava zone circle';
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudHealth) this.hudHealth.textContent = this.playerHealth;
            if (this.hudMoney) this.hudMoney.textContent = this.playerMoney;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons();
        }
    }

    buyPoisonZone() {
        const costs = [10, 15, 20, 25];
        if (this.poisonZoneLevel < 4 && this.playerMoney >= costs[this.poisonZoneLevel]) {
            this.playerMoney -= costs[this.poisonZoneLevel];
            this.poisonZoneLevel++;
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.placingPoisonZone = true;
            this.poisonZonePreview = this.add.graphics();
            this.poisonZonePreview.fillStyle(0x00ff00, 0.5); // green
            this.poisonZonePreview.fillCircle(0, 0, 50);
            this.upgradeText.textContent = 'Click to place poison zone circle';
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons();
        }
    }

    buySpikes() {
        const costs = [10,10,10,10,10,10,10,10,10,10, 50,50,50,50,50,50,50,50,50,50, 50,50,50,50,50,50,50,50,50,50]; // first 10: 10, next 20: 50
        const levelIndex = this.spikesLevel;
        if (this.spikesLevel < 30 && this.playerMoney >= costs[levelIndex]) {
            this.playerMoney -= costs[levelIndex];
            this.spikesLevel++;
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.placingSpikes = true;
            this.spikesPreview = this.add.graphics();
            this.spikesPreview.fillStyle(0x808080, 0.5); // grey
            this.spikesPreview.fillCircle(0, 0, 15);
            this.upgradeText.textContent = 'Click to place spikes';
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons();
        }
    }

    buyPulse() {
        const costs = [100, 200, 300];
        if (this.pulseLevel < 3 && this.playerMoney >= costs[this.pulseLevel]) {
            this.playerMoney -= costs[this.pulseLevel];
            this.pulseLevel++;
            this.pulseDamage = this.pulseLevel;
            this.pulseInterval = 5000 - this.pulseLevel * 1000; // 4000, 3000, 2000
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `Pulse upgraded! Now level ${this.pulseLevel}/3.`;
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }



    togglePause() {
        this.paused = !this.paused;
        this.pauseButton.textContent = this.paused ? 'RESUME' : 'PAUSE';
        if (this.paused) {
            this.physics.pause();
            this.lasers.forEach(laser => laser.clear());
            this.gamePausedText.style.display = 'block';
        } else {
            this.physics.resume();
            this.gamePausedText.style.display = 'none';
        }
    }

    updateUpgradeButtons() {
        const damageCosts = [10, 20, 50, 100, 300];
        const damageCurrentCost = this.damageLevel < 5 ? damageCosts[this.damageLevel] : 0;
        this.damageUpgradeButton.textContent = `DAMAGE - Cost: ${damageCurrentCost} (${this.damageLevel}/5)`;
        this.damageUpgradeButton.disabled = this.damageLevel >= 5 || this.playerMoney < damageCurrentCost;
        const costs = [10, 20, 100, 300];
        const currentCost = this.moreLasersLevel < 4 ? costs[this.moreLasersLevel] : 0;
        this.moreLasersButton.textContent = `MORE LASERS - Cost: ${currentCost} (${this.moreLasersLevel}/4)`;
        this.moreLasersButton.disabled = this.moreLasersLevel >= 4 || this.playerMoney < currentCost;
        const healthCosts = [15, 20, 50];
        const healthCurrentCost = this.healthLevel < 3 ? healthCosts[this.healthLevel] : 0;
        this.healthUpgradeButton.textContent = `HEALTH - Cost: ${healthCurrentCost} (${this.healthLevel}/3)`;
        this.healthUpgradeButton.disabled = this.healthLevel >= 3 || this.playerMoney < healthCurrentCost;
        const lavaCosts = [10, 15, 20, 25];
        const lavaCurrentCost = this.lavaZoneLevel < 4 ? lavaCosts[this.lavaZoneLevel] : 0;
        this.lavaZoneButton.textContent = `LAVA ZONE - Cost: ${lavaCurrentCost} (${this.lavaZoneLevel}/4)`;
        this.lavaZoneButton.disabled = this.lavaZoneLevel >= 4 || this.playerMoney < lavaCurrentCost;
        const poisonCosts = [10, 15, 20, 25];
        const poisonCurrentCost = this.poisonZoneLevel < 4 ? poisonCosts[this.poisonZoneLevel] : 0;
        this.poisonZoneButton.textContent = `POISON ZONE - Cost: ${poisonCurrentCost} (${this.poisonZoneLevel}/4)`;
        this.poisonZoneButton.disabled = this.poisonZoneLevel >= 4 || this.playerMoney < poisonCurrentCost;
        const spikesCosts = [10,10,10,10,10,10,10,10,10,10, 50,50,50,50,50,50,50,50,50,50, 50,50,50,50,50,50,50,50,50,50]; // first 10: 10, next 20: 50
        const spikesCurrentCost = this.spikesLevel < 30 ? spikesCosts[this.spikesLevel] : 0;
        this.spikesButton.textContent = `SPIKES - Cost: ${spikesCurrentCost} (${this.spikesLevel}/30)`;
        this.spikesButton.disabled = this.spikesLevel >= 30 || this.playerMoney < spikesCurrentCost;
        const pulseCosts = [100, 200, 300];
        const pulseCurrentCost = this.pulseLevel < 3 ? pulseCosts[this.pulseLevel] : 0;
        this.pulseButton.textContent = `PULSE - Cost: ${pulseCurrentCost} (${this.pulseLevel}/3)`;
        this.pulseButton.disabled = this.pulseLevel >= 3 || this.playerMoney < pulseCurrentCost;
    }

    showRestartConfirm() {
        this.restartConfirm.style.display = 'block';
    }

    hideRestartConfirm() {
        this.restartConfirm.style.display = 'none';
    }

    resetToMenu() {
        // Reset game variables (same as restartGame)
        this.playerMaxHealth = 5;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.playerDamage = 1;
        this.damageLevel = 0;
        this.healthLevel = 0;
        this.playerCritChance = 0;
        this.moreLasers = false;
        this.moreLasersLevel = 0;
        this.lavaZoneLevel = 0;
        this.lavaZones = [];
        this.placingLavaZone = false;
        this.poisonZoneLevel = 0;
        this.poisonZones = [];
        this.placingPoisonZone = false;
        this.spikesLevel = 0;
        this.spikes = [];
        this.placingSpikes = false;
        this.pulseLevel = 0;
        this.pulseDamage = 1;
        this.pulseInterval = 4000;
        this.pulseTimer = 0;
        this.pulseActive = false;
        this.pulseRadius = 0;
        this.pulseGraphics = null;
        this.level = 1;
        this.enemiesToSpawn = 10;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.remainingEnemies = this.enemiesToSpawn;
        this.enemiesPerBatch = 1;
        this.spawnInterval = 2000;
        this.gameOver = false;
        this.laserActive = false;
        this.damageTimer = 0;
        this.playerDamageTimer = 0;
        this.playerLoseSoundPlayed = false;
        this.levelCompleteSoundPlayed = false;
        this.playerWinSoundPlayed = false;
        this.killSoundPlayed = false;

        // Clear enemies
        const enemiesToDestroy = [...this.enemies.children.entries];
        enemiesToDestroy.forEach(enemy => {
            if (enemy.damageText) enemy.damageText.destroy();
            if (enemy.graphics) enemy.graphics.destroy();
            enemy.destroy();
        });
        this.enemies.clear();

        // Clear lava zones
        this.lavaZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) zone.glow.destroy();
            if (zone.innerWave) zone.innerWave.destroy();
            zone.graphics.destroy();
        });
        this.lavaZones = [];
        // Clear poison zones
        this.poisonZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) zone.glow.destroy();
            if (zone.innerWave) zone.innerWave.destroy();
            zone.graphics.destroy();
        });
        this.poisonZones = [];

        // Clear spikes
        this.spikes.forEach(spike => {
            if (spike.innerWave) spike.innerWave.destroy();
            spike.graphics.destroy();
        });
        this.spikes = [];

        // Clear lasers
        this.lasers.forEach(laser => laser.clear());
        this.lasers = [this.add.graphics()];

        // Hide game elements and show menu
        this.gameStarted = false;
        this.startButton.style.display = 'block';
        this.startText.style.display = 'block';
        this.pauseButton.style.display = 'none';
        this.restartButton.style.display = 'none';
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.canvas.style.border = 'none';
        }
        this.upgradeWindow.style.display = 'none';
        document.getElementById('stats-window').style.display = 'none';
        document.getElementById('hud-window').style.display = 'none';
        document.getElementById('audio-controls').style.display = 'none';

        // Hide overlays
        this.gameOverText.style.display = 'none';
        this.tryAgainButton.style.display = 'none';
        this.levelCompleteText.style.display = 'none';
        this.nextLevelButton.style.display = 'none';
        this.gameWinText.style.display = 'none';
        this.gamePausedText.style.display = 'none';
    }


}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
