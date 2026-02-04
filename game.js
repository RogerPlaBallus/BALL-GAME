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
        this.playerSizeMultiplier = 0; // Size increase: 0-0.15 (0-15%)
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
        this.bounceLevel = 0;
        this.bounceBouncesCount = 0; // number of bounces per laser
        this.bouncePaths = []; // Store bounce paths for visualization
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
        this.infiniteMode = false;
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

        // Create small particle textures for zones
        this.createCircleTexture('lavaParticle', 0xff4500, 2);
        this.createCircleTexture('poisonParticle', 0x00ff00, 2);

        // Get canvas dimensions
        this.canvasWidth = this.game.config.width;
        this.canvasHeight = this.game.config.height;

        // Set canvas background color
        

        // Player (white sphere at center)
        this.playerBaseSize = 20;
        this.playerCurrentSize = this.playerBaseSize;
        this.player = this.add.graphics();
        this.player.fillStyle(0xffffff);
        this.player.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, this.playerCurrentSize);

        // Player circle for collision
        this.playerCircle = new Phaser.Geom.Circle(this.canvasWidth / 2, this.canvasHeight / 2, this.playerCurrentSize);

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

        // Infinite Mode button
        this.infiniteModeButton = document.getElementById('infinite-mode-button');
        this.infiniteModeButton.addEventListener('click', () => {
            this.startInfiniteMode();
        });

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
        this.spikesButton.addEventListener('mouseenter', () => {
            this.spikesButton.classList.add('show-tooltip');
        });
        this.spikesButton.addEventListener('mouseleave', () => {
            this.spikesButton.classList.remove('show-tooltip');
        });

        // Pulse upgrade button
        this.pulseButton = document.getElementById('pulse-button');
        this.pulseButton.addEventListener('click', () => {
            this.buyPulse();
        });

        // Bounce upgrade button
        this.bounceButton = document.getElementById('bounce-button');
        this.bounceButton.addEventListener('click', () => {
            this.buyBounce();
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
        const pointer = this.input.activePointer;
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
            // Update bounce paths every frame for smooth real-time following
            if (this.bounceLevel > 0) {
                this.updateBouncePaths();
            }
            
            this.drawLaser();

            // Check laser hits
            this.damageTimer += delta;
            if (this.damageTimer >= this.laserSpeed) {
                this.killSoundPlayed = false;
                let enemyNearDeath = false;
                this.targets.forEach((target, index) => {
                    this.enemies.children.entries.forEach(enemy => {
                        if (this.checkLaserHit(target.x, target.y, enemy)) {
                            // Apply initial damage
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
                            
                            // Handle bounce damage if bounce upgrade is purchased
                            if (this.bounceLevel > 0) {
                                this.applyBounce(enemy, damage, new Set([enemy]), 0, index);
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
        if (this.hudLevel) this.hudLevel.textContent = this.infiniteMode ? '∞' : this.level;
        if (this.hudEnemies) this.hudEnemies.textContent = this.infiniteMode ? '∞' : this.remainingEnemies;

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
        if (!this.infiniteMode && this.enemiesAlive === 0 && this.enemiesSpawned === this.enemiesToSpawn) {
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
                this.infiniteModeButton.style.display = 'block';
            } else {
                this.levelCompleteText.style.display = 'block';
                this.nextLevelButton.style.display = 'block';
            }
        }

        // Handle lava zone placement
        this.handleZonePlacement('lava');

        // Handle poison zone placement
        this.handleZonePlacement('poison');

        // Handle spikes placement
        if (this.placingSpikes) {
            // Update preview position to follow mouse
            if (this.spikesPreview && pointer) {
                this.spikesPreview.setPosition(pointer.worldX, pointer.worldY);
            }
            // Place spikes on click
            if (!this.pointerWasDown && pointer && pointer.isDown && this.spikesPreview) {
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
        this.applyZoneDamage('lava');

        // Poison zone damage
        this.applyZoneDamage('poison');

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
                if (zone.glow) { zone.glow.clear(); zone.glow.destroy(); }
                if (zone.innerWave) { zone.innerWave.clear(); zone.innerWave.destroy(); }
                if (zone.graphics) { zone.graphics.clear(); zone.graphics.destroy(); }
            });
            this.poisonZones = [];
            // Clear spikes on game over
            this.spikes.forEach(spike => {
                if (spike.innerWave) { spike.innerWave.clear(); spike.innerWave.destroy(); }
                if (spike.graphics) { spike.graphics.clear(); spike.graphics.destroy(); }
            });
            this.spikes = [];
        }

        // Update pointer state for click detection
        this.pointerWasDown = pointer ? pointer.isDown : false;
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

        // Reset upgrade button animations
        const containers = ['damage-container', 'more-lasers-container', 'health-container', 'lava-zone-container', 'poison-zone-container', 'spikes-container', 'pulse-container'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.classList.remove('maxed-out');
            }
        });
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
            if (zone.glow) { zone.glow.clear(); zone.glow.destroy(); }
            if (zone.innerWave) { zone.innerWave.clear(); zone.innerWave.destroy(); }
            if (zone.graphics) { zone.graphics.clear(); zone.graphics.destroy(); }
        });
        // Clear poison zones
        this.poisonZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) { zone.glow.clear(); zone.glow.destroy(); }
            if (zone.innerWave) { zone.innerWave.clear(); zone.innerWave.destroy(); }
            if (zone.graphics) { zone.graphics.clear(); zone.graphics.destroy(); }
        });
        // Clear spikes
        this.spikes.forEach(spike => {
            if (spike.innerWave) { spike.innerWave.clear(); spike.innerWave.destroy(); }
            if (spike.graphics) { spike.graphics.clear(); spike.graphics.destroy(); }
        });

        // Clear lasers
        this.lasers.forEach(laser => laser.clear());

        // Kill any ongoing tweens
        this.tweens.killAll();

        // Reset game variables
        this.playerMaxHealth = 5;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.playerDamage = 1;
        this.damageLevel = 0;
        this.healthLevel = 0;
        this.playerSizeMultiplier = 0; // Reset player size to base
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
        this.bounceLevel = 0;
        this.bounceBouncesCount = 0;
        this.bouncePaths = [];
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

        // Reset player size
        this.playerCurrentSize = this.playerBaseSize;
        this.player.clear();
        this.player.fillStyle(0xffffff);
        this.player.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, this.playerCurrentSize);
        this.playerCircle.radius = this.playerCurrentSize;

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

        // Set enemy health based on level or infinite mode
        let baseHealth;
        if (this.infiniteMode) {
            baseHealth = 15; // Start with level 20 health
            const healthMultiplier = Math.floor(this.enemiesSpawned / 50) * 0.03;
            enemy.health = Math.floor(baseHealth * (1 + healthMultiplier));
        } else {
            if (this.level <= 4) {
                baseHealth = 5;
            } else if (this.level <= 9) {
                baseHealth = 7;
            } else if (this.level <= 14) {
                baseHealth = 10;
            } else {
                baseHealth = 15;
            }
            enemy.health = baseHealth;
        }
        enemy.damageTaken = 0;
        enemy.lastSpikeDamage = 0;
        enemy.lastLavaDamage = 0;
        enemy.lastPoisonDamage = 0;
        enemy.lastPulseDamage = 0;
        enemy.setCollideWorldBounds(false);

        // Add graphics for enemy
        enemy.graphics = this.add.graphics();
        enemy.graphics.fillStyle(0x880000);
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
                
                // Draw bounce paths for this laser
                this.bouncePaths.forEach(path => {
                    if (path.laserIndex === index) {
                        // Solid core for bounce
                        laser.lineStyle(3, color, 1);
                        laser.beginPath();
                        laser.moveTo(path.fromX, path.fromY);
                        laser.lineTo(path.toX, path.toY);
                        laser.strokePath();

                        // Outer glow layer for bounce
                        laser.lineStyle(8, color, 0.4);
                        laser.beginPath();
                        laser.moveTo(path.fromX, path.fromY);
                        laser.lineTo(path.toX, path.toY);
                        laser.strokePath();

                        // Subtle outer glow for bounce
                        laser.lineStyle(12, color, 0.2);
                        laser.beginPath();
                        laser.moveTo(path.fromX, path.fromY);
                        laser.lineTo(path.toX, path.toY);
                        laser.strokePath();
                    }
                });
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

    updateBouncePaths() {
        // Recalculate bounce paths every frame based on current target positions
        this.bouncePaths = [];
        
        this.targets.forEach((target, laserIndex) => {
            // Find the enemy at the current target position (or closest to it)
            let hitEnemy = null;
            this.enemies.children.entries.forEach(enemy => {
                const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
                if (distance < 30) { // tolerance for movement
                    hitEnemy = enemy;
                }
            });
            
            // If we found an enemy, calculate bounce chains from it
            if (hitEnemy && hitEnemy.health > 0) {
                this.calculateBounceChain(hitEnemy, new Set([hitEnemy]), 0, laserIndex);
            }
        });
    }

    calculateBounceChain(currentEnemy, hitEnemies, bounceCount, laserIndex) {
        // Recursively calculate bounce paths without applying damage
        if (bounceCount >= this.bounceBouncesCount) {
            return; // Stop bouncing
        }
        
        // Find nearest alive enemy that hasn't been hit yet
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            // Skip if enemy has already been hit or is the current enemy
            if (!hitEnemies.has(enemy) && enemy !== currentEnemy && enemy.health > 0) {
                const distance = Phaser.Math.Distance.Between(currentEnemy.x, currentEnemy.y, enemy.x, enemy.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        // If found a valid target, store the path and recurse
        if (nearestEnemy) {
            hitEnemies.add(nearestEnemy);
            
            // Store bounce path for visualization
            this.bouncePaths.push({
                fromX: currentEnemy.x,
                fromY: currentEnemy.y,
                toX: nearestEnemy.x,
                toY: nearestEnemy.y,
                laserIndex: laserIndex
            });
            
            // Continue bouncing
            this.calculateBounceChain(nearestEnemy, hitEnemies, bounceCount + 1, laserIndex);
        }
    }

    applyBounce(currentEnemy, damage, hitEnemies, bounceCount, laserIndex) {
        // Recursively apply damage to nearest enemies
        if (bounceCount >= this.bounceBouncesCount) {
            return; // Stop bouncing
        }
        
        // Find nearest alive enemy that hasn't been hit yet
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            // Skip if enemy has already been hit or is the current enemy
            if (!hitEnemies.has(enemy) && enemy !== currentEnemy && enemy.health > 0) {
                const distance = Phaser.Math.Distance.Between(currentEnemy.x, currentEnemy.y, enemy.x, enemy.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        // If found a valid target, apply damage and recurse
        if (nearestEnemy) {
            hitEnemies.add(nearestEnemy);
            
            // Store bounce path for visualization
            this.bouncePaths.push({
                fromX: currentEnemy.x,
                fromY: currentEnemy.y,
                toX: nearestEnemy.x,
                toY: nearestEnemy.y,
                laserIndex: laserIndex
            });
            
            nearestEnemy.damageTaken += damage;
            nearestEnemy.health -= damage;
            if (nearestEnemy.damageText) {
                nearestEnemy.damageText.setText("-" + nearestEnemy.damageTaken);
            } else {
                nearestEnemy.damageText = this.add.text(nearestEnemy.x + 10, nearestEnemy.y - 25, "-" + nearestEnemy.damageTaken, { fontSize: '20px', fill: '#ff0000' });
            }
            
            if (nearestEnemy.health <= 0) {
                if (nearestEnemy.damageText) { nearestEnemy.damageText.destroy(); }
                nearestEnemy.graphics.destroy();
                nearestEnemy.destroy();
                this.enemiesAlive--;
                this.remainingEnemies--;
                this.playerMoney++;
            }
            
            // Continue bouncing
            this.applyBounce(nearestEnemy, damage, hitEnemies, bounceCount + 1, laserIndex);
        }
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
            
            // Increase player size by 5% if not at max (15%)
            if (this.playerSizeMultiplier < 0.15) {
                this.playerSizeMultiplier += 0.05;
                // Animate the size increase
                const targetSize = this.playerBaseSize * (1 + this.playerSizeMultiplier);
                this.tweens.add({
                    targets: this,
                    playerCurrentSize: targetSize,
                    duration: 500,
                    ease: 'Power2.easeOut',
                    onUpdate: () => {
                        // Redraw player during animation
                        this.player.clear();
                        this.player.fillStyle(0xffffff);
                        this.player.fillCircle(this.canvasWidth / 2, this.canvasHeight / 2, this.playerCurrentSize);
                        // Update collision circle
                        this.playerCircle.radius = this.playerCurrentSize;
                    }
                });
            }
            
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `Health upgraded! Now level ${this.healthLevel}/3. Player size +5%`;
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
            this.startZonePlacement('lava');
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
            this.startZonePlacement('poison');
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
            // Position the graphics object off-screen initially to prevent the grey box appearing at (0,0)
            this.spikesPreview.setPosition(-1000, -1000);
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

    buyBounce() {
        const costs = [500, 1000, 1000];
        const bounceValues = [2, 3, 5]; // bounces for levels 1, 2, 3
        if (this.bounceLevel < 3 && this.playerMoney >= costs[this.bounceLevel]) {
            this.playerMoney -= costs[this.bounceLevel];
            this.bounceLevel++;
            this.bounceBouncesCount = bounceValues[this.bounceLevel - 1]; // 2, 3, or 5 bounces
            const currentTime = this.time.now;
            if (currentTime - this.lastUpgradeSoundTime > 100) { // Prevent overlapping sounds
                this.upgradesound.play();
                this.lastUpgradeSoundTime = currentTime;
            }
            this.upgradeText.textContent = `Bounce upgraded! Now level ${this.bounceLevel}/3.`;
            if (this.hudLevel) this.hudLevel.textContent = this.level;
            if (this.hudEnemies) this.hudEnemies.textContent = this.remainingEnemies;
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }

    // Helper to create a small circular texture for particles
    createCircleTexture(key, color, radius = 2) {
        const g = this.add.graphics();
        g.fillStyle(color);
        g.fillCircle(radius, radius, radius);
        // The texture size should be (radius*2)x(radius*2)
        g.generateTexture(key, radius * 2, radius * 2);
        g.destroy();
    }

    // Start placement for lava or poison zones (creates preview)
    startZonePlacement(kind) {
        const cfg = {
            lava: { previewProp: 'lavaZonePreview', placingProp: 'placingLavaZone', color: 0xff4500, particle: 'lavaParticle', text: 'Click to place lava zone circle' },
            poison: { previewProp: 'poisonZonePreview', placingProp: 'placingPoisonZone', color: 0x00ff00, particle: 'poisonParticle', text: 'Click to place poison zone circle' }
        }[kind];
        if (!cfg) return;
        // Clean up any existing preview
        if (this[cfg.previewProp]) {
            this[cfg.previewProp].clear();
            this[cfg.previewProp].setPosition(-1000, -1000);
            this[cfg.previewProp].destroy();
        }
        this[cfg.placingProp] = true;
        this[cfg.previewProp] = this.add.graphics();
        // Defensive: clear, move off-screen, and hide immediately
        this[cfg.previewProp].clear();
        this[cfg.previewProp].setPosition(-1000, -1000);
        this[cfg.previewProp].visible = false;
        // Store color info for later drawing
        this[cfg.previewProp]._zoneColor = cfg.color;
        this.upgradeText.textContent = cfg.text;
    }

    // Handle placement for zones (called each update)
    handleZonePlacement(kind) {
        const pointer = this.input.activePointer;
        if (kind === 'lava' && this.placingLavaZone) {
            if (this.lavaZonePreview && pointer) {
                // Only draw preview if pointer is inside play area and not at (0,0)
                if (
                    pointer.worldX > 0 && pointer.worldY > 0 &&
                    pointer.worldX < this.canvasWidth && pointer.worldY < this.canvasHeight
                ) {
                    this.lavaZonePreview.visible = true;
                    this.lavaZonePreview.clear();
                    this.lavaZonePreview.fillStyle(0xff4500, 0.5);
                    this.lavaZonePreview.fillCircle(0, 0, 50);
                    this.lavaZonePreview.setPosition(pointer.worldX, pointer.worldY);
                } else {
                    this.lavaZonePreview.visible = false;
                    this.lavaZonePreview.clear();
                    this.lavaZonePreview.setPosition(-1000, -1000);
                }
            }
            if (!this.pointerWasDown && pointer.isDown && this.lavaZonePreview) {
                const x = pointer.worldX;
                const y = pointer.worldY;
                // Prevent placement at invalid positions like (0,0)
                if (x <= 0 || y <= 0 || x >= this.canvasWidth || y >= this.canvasHeight) return;
                // Clear and destroy preview immediately before creating zone
                if (this.lavaZonePreview) {
                    this.lavaZonePreview.clear();
                    this.lavaZonePreview.setPosition(-1000, -1000);
                    this.lavaZonePreview.destroy();
                    this.lavaZonePreview = null;
                }
                this.placingLavaZone = false;
                console.log('[LAVA] Creating zone at', x, y);
                const zone = this.add.graphics();
                zone.fillStyle(0xff4500, 0.7);
                zone.fillCircle(0, 0, 50);
                zone.setPosition(x, y);
                zone.setDepth(10);
                console.log('[LAVA] Creating emitter at', x, y);
                const emitter = this.add.particles('lavaParticle', {
                    speed: { min: 10, max: 50 }, scale: { start: 0.5, end: 0 }, lifespan: 1000, frequency: 100, quantity: 2, emitting: true
                }).setPosition(x, y);
                console.log('[LAVA] Creating glow at', x, y);
                const glow = this.add.graphics();
                glow.fillStyle(0xff4500, 0.3); glow.fillCircle(0, 0, 60); glow.setPosition(x, y);
                glow.setDepth(5);
                this.tweens.add({ targets: glow, alpha: { from: 0.3, to: 0.5 }, duration: 300, yoyo: true, repeat: -1 });
                console.log('[LAVA] Creating innerWave at', x, y);
                const innerWave = this.add.graphics(); innerWave.fillStyle(0xff4500, 0.4); innerWave.fillCircle(0, 0, 20); innerWave.setPosition(x, y);
                innerWave.setDepth(15);
                this.tweens.add({ targets: innerWave, scaleX: { from: 0.1, to: 2.0 }, scaleY: { from: 0.1, to: 2.0 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                this.lavaZones.push({ x, y, radius: 50, graphics: zone, emitter, glow, innerWave });
                this.upgradeText.textContent = 'Lava zone placed!';
                this.time.delayedCall(2000, () => { this.upgradeText.textContent = ''; });
            }
        }
        if (kind === 'poison' && this.placingPoisonZone) {
            if (this.poisonZonePreview && pointer) {
                // Only draw preview if pointer is inside play area and not at (0,0)
                if (
                    pointer.worldX > 0 && pointer.worldY > 0 &&
                    pointer.worldX < this.canvasWidth && pointer.worldY < this.canvasHeight
                ) {
                    this.poisonZonePreview.visible = true;
                    this.poisonZonePreview.clear();
                    this.poisonZonePreview.fillStyle(0x00ff00, 0.5);
                    this.poisonZonePreview.fillCircle(0, 0, 50);
                    this.poisonZonePreview.setPosition(pointer.worldX, pointer.worldY);
                } else {
                    this.poisonZonePreview.visible = false;
                    this.poisonZonePreview.clear();
                    this.poisonZonePreview.setPosition(-1000, -1000);
                }
            }
            if (!this.pointerWasDown && pointer.isDown && this.poisonZonePreview) {
                const x = pointer.worldX;
                const y = pointer.worldY;
                // Prevent placement at invalid positions like (0,0)
                if (x <= 0 || y <= 0 || x >= this.canvasWidth || y >= this.canvasHeight) return;
                // Clear and destroy preview immediately before creating zone
                if (this.poisonZonePreview) {
                    this.poisonZonePreview.clear();
                    this.poisonZonePreview.setPosition(-1000, -1000);
                    this.poisonZonePreview.destroy();
                    this.poisonZonePreview = null;
                }
                this.placingPoisonZone = false;
                console.log('[POISON] Creating zone at', x, y);
                const zone = this.add.graphics();
                zone.fillStyle(0x00ff00, 0.7);
                zone.fillCircle(0, 0, 50);
                zone.setPosition(x, y);
                zone.setDepth(10);
                console.log('[POISON] Creating emitter at', x, y);
                const emitter = this.add.particles('poisonParticle', {
                    speed: { min: 10, max: 50 }, scale: { start: 0.5, end: 0 }, lifespan: 1000, frequency: 100, quantity: 2, emitting: true
                }).setPosition(x, y);
                console.log('[POISON] Creating glow at', x, y);
                const glow = this.add.graphics(); glow.fillStyle(0x00ff00, 0.3); glow.fillCircle(0, 0, 60); glow.setPosition(x, y);
                glow.setDepth(5);
                this.tweens.add({ targets: glow, alpha: { from: 0.3, to: 0.5 }, duration: 300, yoyo: true, repeat: -1 });
                console.log('[POISON] Creating innerWave at', x, y);
                const innerWave = this.add.graphics(); innerWave.fillStyle(0x00ff00, 0.4); innerWave.fillCircle(0, 0, 20); innerWave.setPosition(x, y);
                innerWave.setDepth(15);
                this.tweens.add({ targets: innerWave, scaleX: { from: 0.1, to: 2.0 }, scaleY: { from: 0.1, to: 2.0 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                this.poisonZones.push({ x, y, radius: 50, graphics: zone, emitter, glow, innerWave });
                this.upgradeText.textContent = 'Poison zone placed!';
                this.time.delayedCall(2000, () => { this.upgradeText.textContent = ''; });
            }
        }
    }

    // Apply damage to enemies inside lava/poison zones (kind: 'lava' | 'poison')
    applyZoneDamage(kind) {
        const zones = kind === 'lava' ? this.lavaZones : this.poisonZones;
        const lastKey = kind === 'lava' ? 'lastLavaDamage' : 'lastPoisonDamage';
        zones.forEach(zone => {
            this.enemies.children.entries.forEach(enemy => {
                const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 16);
                const zoneCircle = new Phaser.Geom.Circle(zone.x, zone.y, zone.radius);
                if (Phaser.Geom.Intersects.CircleToCircle(enemyCircle, zoneCircle)) {
                    if (!enemy[lastKey]) enemy[lastKey] = 0;
                    const currentTime = this.time.now;
                    if (currentTime - enemy[lastKey] >= 1000) {
                        enemy.damageTaken += 1;
                        enemy.health -= 1;
                        enemy[lastKey] = currentTime;
                        if (enemy.damageText) {
                            enemy.damageText.setText("-" + enemy.damageTaken);
                        } else {
                            enemy.damageText = this.add.text(enemy.x + 10, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '24px', fill: '#ff0000' });
                        }
                        if (enemy.health <= 0) {
                            if (enemy.damageText) enemy.damageText.destroy();
                            enemy.graphics.destroy(); enemy.destroy(); this.enemiesAlive--; this.remainingEnemies--; this.playerMoney++;
                        }
                    }
                }
            });
        });
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
        const damageContainer = document.getElementById('damage-container');
        if (damageContainer) {
            if (this.damageLevel >= 5) {
                if (!damageContainer.classList.contains('maxed-out')) {
                    damageContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        damageContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                damageContainer.classList.remove('maxed-out');
                damageContainer.classList.remove('collapsed');
            }
        }

        const costs = [10, 20, 100, 300];
        const currentCost = this.moreLasersLevel < 4 ? costs[this.moreLasersLevel] : 0;
        this.moreLasersButton.textContent = `MORE LASERS - Cost: ${currentCost} (${this.moreLasersLevel}/4)`;
        this.moreLasersButton.disabled = this.moreLasersLevel >= 4 || this.playerMoney < currentCost;
        const moreLasersContainer = document.getElementById('more-lasers-container');
        if (moreLasersContainer) {
            if (this.moreLasersLevel >= 4) {
                if (!moreLasersContainer.classList.contains('maxed-out')) {
                    moreLasersContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        moreLasersContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                moreLasersContainer.classList.remove('maxed-out');
                moreLasersContainer.classList.remove('collapsed');
            }
        }

        const healthCosts = [15, 20, 50];
        const healthCurrentCost = this.healthLevel < 3 ? healthCosts[this.healthLevel] : 0;
        this.healthUpgradeButton.textContent = `HEALTH - Cost: ${healthCurrentCost} (${this.healthLevel}/3)`;
        this.healthUpgradeButton.disabled = this.healthLevel >= 3 || this.playerMoney < healthCurrentCost;
        const healthContainer = document.getElementById('health-container');
        if (healthContainer) {
            if (this.healthLevel >= 3) {
                if (!healthContainer.classList.contains('maxed-out')) {
                    healthContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        healthContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                healthContainer.classList.remove('maxed-out');
                healthContainer.classList.remove('collapsed');
            }
        }

        const lavaCosts = [10, 15, 20, 25];
        const lavaCurrentCost = this.lavaZoneLevel < 4 ? lavaCosts[this.lavaZoneLevel] : 0;
        this.lavaZoneButton.textContent = `LAVA ZONE - Cost: ${lavaCurrentCost} (${this.lavaZoneLevel}/4)`;
        this.lavaZoneButton.disabled = this.lavaZoneLevel >= 4 || this.playerMoney < lavaCurrentCost;
        const lavaContainer = document.getElementById('lava-zone-container');
        if (lavaContainer) {
            if (this.lavaZoneLevel >= 4) {
                if (!lavaContainer.classList.contains('maxed-out')) {
                    lavaContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        lavaContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                lavaContainer.classList.remove('maxed-out');
                lavaContainer.classList.remove('collapsed');
            }
        }

        const poisonCosts = [10, 15, 20, 25];
        const poisonCurrentCost = this.poisonZoneLevel < 4 ? poisonCosts[this.poisonZoneLevel] : 0;
        this.poisonZoneButton.textContent = `POISON ZONE - Cost: ${poisonCurrentCost} (${this.poisonZoneLevel}/4)`;
        this.poisonZoneButton.disabled = this.poisonZoneLevel >= 4 || this.playerMoney < poisonCurrentCost;
        const poisonContainer = document.getElementById('poison-zone-container');
        if (poisonContainer) {
            if (this.poisonZoneLevel >= 4) {
                if (!poisonContainer.classList.contains('maxed-out')) {
                    poisonContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        poisonContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                poisonContainer.classList.remove('maxed-out');
                poisonContainer.classList.remove('collapsed');
            }
        }

        const spikesCosts = [10,10,10,10,10,10,10,10,10,10, 50,50,50,50,50,50,50,50,50,50, 50,50,50,50,50,50,50,50,50,50]; // first 10: 10, next 20: 50
        const spikesCurrentCost = this.spikesLevel < 30 ? spikesCosts[this.spikesLevel] : 0;
        this.spikesButton.textContent = `SPIKES - Cost: ${spikesCurrentCost} (${this.spikesLevel}/30)`;
        this.spikesButton.disabled = this.spikesLevel >= 30 || this.playerMoney < spikesCurrentCost;
        const spikesContainer = document.getElementById('spikes-container');
        if (spikesContainer) {
            if (this.spikesLevel >= 30) {
                if (!spikesContainer.classList.contains('maxed-out')) {
                    spikesContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        spikesContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                spikesContainer.classList.remove('maxed-out');
                spikesContainer.classList.remove('collapsed');
            }
        }

        const pulseCosts = [100, 200, 300];
        const pulseCurrentCost = this.pulseLevel < 3 ? pulseCosts[this.pulseLevel] : 0;
        this.pulseButton.textContent = `PULSE - Cost: ${pulseCurrentCost} (${this.pulseLevel}/3)`;
        this.pulseButton.disabled = this.pulseLevel >= 3 || this.playerMoney < pulseCurrentCost;
        const pulseContainer = document.getElementById('pulse-container');
        if (pulseContainer) {
            if (this.pulseLevel >= 3) {
                if (!pulseContainer.classList.contains('maxed-out')) {
                    pulseContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        pulseContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                pulseContainer.classList.remove('maxed-out');
                pulseContainer.classList.remove('collapsed');
            }
        }

        const bounceCosts = [500, 1000, 2000];
        const bounceCurrentCost = this.bounceLevel < 3 ? bounceCosts[this.bounceLevel] : 0;
        this.bounceButton.textContent = `BOUNCE - Cost: ${bounceCurrentCost} (${this.bounceLevel}/3)`;
        this.bounceButton.disabled = this.bounceLevel >= 3 || this.playerMoney < bounceCurrentCost;
        const bounceContainer = document.getElementById('bounce-container');
        if (bounceContainer) {
            if (this.bounceLevel >= 3) {
                if (!bounceContainer.classList.contains('maxed-out')) {
                    bounceContainer.classList.add('maxed-out');
                    setTimeout(() => {
                        bounceContainer.classList.add('collapsed');
                    }, 2000);
                }
            } else {
                bounceContainer.classList.remove('maxed-out');
                bounceContainer.classList.remove('collapsed');
            }
        }
    }

    showRestartConfirm() {
        this.restartConfirm.style.display = 'block';
    }

    hideRestartConfirm() {
        this.restartConfirm.style.display = 'none';
    }

    startInfiniteMode() {
        this.gameWinText.style.display = 'none';
        this.infiniteModeButton.style.display = 'none';
        this.infiniteMode = true;
        this.enemiesToSpawn = Infinity; // Set to infinity for infinite spawning
        this.remainingEnemies = Infinity;
        this.enemiesPerBatch = 20; // Increase batch size for infinite mode
        this.spawnInterval = 1000; // Faster spawning
        this.physics.resume();
        this.startLevel();
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
        this.infiniteMode = false; // Reset infinite mode

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
            if (zone.glow) { zone.glow.clear(); zone.glow.destroy(); }
            if (zone.innerWave) { zone.innerWave.clear(); zone.innerWave.destroy(); }
            if (zone.graphics) { zone.graphics.clear(); zone.graphics.destroy(); }
        });
        this.lavaZones = [];
        // Clear poison zones
        this.poisonZones.forEach(zone => {
            if (zone.emitter) zone.emitter.destroy();
            if (zone.glow) { zone.glow.clear(); zone.glow.destroy(); }
            if (zone.innerWave) { zone.innerWave.clear(); zone.innerWave.destroy(); }
            if (zone.graphics) { zone.graphics.clear(); zone.graphics.destroy(); }
        });
        this.poisonZones = [];

        // Clear spikes
        this.spikes.forEach(spike => {
            if (spike.innerWave) { spike.innerWave.clear(); spike.innerWave.destroy(); }
            if (spike.graphics) { spike.graphics.clear(); spike.graphics.destroy(); }
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

        // Reset upgrade button animations
        const containers = ['damage-container', 'more-lasers-container', 'health-container', 'lava-zone-container', 'poison-zone-container', 'spikes-container', 'pulse-container'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.classList.remove('maxed-out');
            }
        });
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
