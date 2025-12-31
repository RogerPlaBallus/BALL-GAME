class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.audio('soundtrack', 'sounds/soundtrack.mp3');
        this.load.audio('killsound', 'sounds/killsound.mp3');
    }

    create() {
        // Game variables
        this.playerMaxHealth = 5;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.playerDamage = 1;
        this.moreLasers = false;
        this.moreLasersLevel = 0;
        this.laserSpeed = 500; // milliseconds between laser damages
        this.baseSpeed = 50; // base enemy speed
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

        // Get canvas dimensions
        this.canvasWidth = this.game.config.width;
        this.canvasHeight = this.game.config.height;

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

        // HUD
        this.hudText = this.add.text(10, 10, `Level ${this.level}\nHealth: ${this.playerHealth}\nEnemies: ${this.remainingEnemies}`, {
            fontSize: '18px',
            fill: '#ffffff'
        });

        // Start button
        this.startButton = document.getElementById('start-button');
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

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
        this.upgradeWindow.style.display = 'block';
        this.upgradeText = document.getElementById('upgrade-text');

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



        // Physics overlaps handled in update

        // Audio setup
        this.soundtrack = this.sound.add('soundtrack', { loop: true, volume: 0.1 });
        this.killsound = this.sound.add('killsound', { volume: 1 });

        // Volume controls
        const musicVolumeSlider = document.getElementById('music-volume');
        const effectsVolumeSlider = document.getElementById('effects-volume');
        musicVolumeSlider.addEventListener('input', () => {
            this.soundtrack.setVolume(musicVolumeSlider.value * 0.1);
        });
        effectsVolumeSlider.addEventListener('input', () => {
            this.killsound.setVolume(effectsVolumeSlider.value);
        });

        // Play soundtrack on page load
        this.soundtrack.play();

        // Auto-player: no manual input needed
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver || this.levelComplete || this.paused) return;

        // Move enemies towards player
        this.enemies.children.entries.forEach(enemy => {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.canvasWidth / 2, this.canvasHeight / 2);
            const speed = this.baseSpeed * (1 + (this.level - 1) * 0.02);
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            // Update graphics position
            enemy.graphics.setPosition(enemy.x, enemy.y);
            // Update damage text position if it exists
            if (enemy.damageText) {
                enemy.damageText.setPosition(enemy.x, enemy.y - 25);
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
                this.targets.forEach((target, index) => {
                    this.enemies.children.entries.forEach(enemy => {
                        if (this.checkLaserHit(target.x, target.y, enemy)) {
                            enemy.damageTaken += this.playerDamage;
                            enemy.health -= this.playerDamage;
                            if (enemy.damageText) {
                                enemy.damageText.setText("-" + enemy.damageTaken);
                            } else {
                                enemy.damageText = this.add.text(enemy.x, enemy.y - 25, "-" + enemy.damageTaken, { fontSize: '16px', fill: '#ff0000' });
                            }
                            if (enemy.health === 1) {
                                this.killsound.play();
                            }
                            if (enemy.health <= 0) {
                                if (enemy.damageText) enemy.damageText.destroy();
                                enemy.graphics.destroy();
                                enemy.destroy();
                                this.enemiesAlive--;
                                this.remainingEnemies--;
                                this.playerMoney++;
                            }
                        }
                    });
                });
                this.damageTimer = 0;
            }
        }

        // Check player damage
        let playerDamaged = false;
        this.enemies.children.entries.forEach(enemy => {
            const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 15);
            if (Phaser.Geom.Intersects.CircleToCircle(this.playerCircle, enemyCircle)) {
                playerDamaged = true;
            }
        });
        if (playerDamaged) {
            this.playerDamageTimer += delta;
            if (this.playerDamageTimer >= 1000) { // 1 damage per second
                this.playerHealth -= 1;
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
        this.hudText.setText(`Level ${this.level}\nHealth: ${this.playerHealth}\nMoney: ${this.playerMoney}\nEnemies: ${this.remainingEnemies}`);

        // Update upgrade buttons
        this.updateUpgradeButtons();

        // Check level complete
        if (this.enemiesAlive === 0 && this.enemiesSpawned === this.enemiesToSpawn) {
            this.levelComplete = true;
            this.physics.pause();
            if (this.level === this.maxLevel) {
                this.gameWinText.style.display = 'block';
            } else {
                this.levelCompleteText.style.display = 'block';
                this.nextLevelButton.style.display = 'block';
            }
        }

        // Check game over
        if (this.playerHealth <= 0) {
            this.gameOver = true;
            this.gameOverText.style.display = 'block';
            this.tryAgainButton.style.display = 'block';
            this.physics.pause();
        }
    }

    startGame() {
        this.gameStarted = true;
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'block';
        this.restartButton.style.display = 'block';
        this.startLevel();
    }

    startLevel() {
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.remainingEnemies = this.enemiesToSpawn;
        this.levelComplete = false;
        this.paused = false;
        this.spawnTimer = 0;
        // Clear any remaining enemies
        this.enemies.children.entries.forEach(enemy => {
            enemy.graphics.destroy();
            enemy.destroy();
        });
        this.enemies.clear();
        // Hide overlays
        this.levelCompleteText.style.display = 'none';
        this.nextLevelButton.style.display = 'none';
        this.gameWinText.style.display = 'none';
        this.gamePausedText.style.display = 'none';
        // Resume physics
        this.physics.resume();
    }

    restartGame() {
        // Reset game variables
        this.playerMaxHealth = 100;
        this.playerHealth = this.playerMaxHealth;
        this.playerMoney = 0;
        this.moreLasers = false;
        this.moreLasersLevel = 0;
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

        // Hide overlays
        this.gameOverText.style.display = 'none';
        this.tryAgainButton.style.display = 'none';

        // Clear enemies
        const enemiesToDestroy = [...this.enemies.children.entries];
        enemiesToDestroy.forEach(enemy => {
            if (enemy.graphics) enemy.graphics.destroy();
            enemy.destroy();
        });
        this.enemies.clear();

        // Clear lasers
        this.lasers.forEach(laser => laser.clear());
        this.lasers = [this.add.graphics()];

        // Update HUD
        this.hudText.setText(`Level ${this.level}\nHealth: ${this.playerHealth}\nEnemies: ${this.remainingEnemies}`);

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
        enemy.setCircle(15);
        enemy.health = 5;
        enemy.damageTaken = 0;
        enemy.setCollideWorldBounds(false);

        // Add graphics for enemy
        enemy.graphics = this.add.graphics();
        enemy.graphics.fillStyle(0xff0000);
        enemy.graphics.fillCircle(0, 0, 15);
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

                // Draw high-definition glow effect with sharper, bolder strokes
                laser.lineStyle(12, color, 0.05);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                laser.lineStyle(10, color, 0.15);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                laser.lineStyle(8, color, 0.3);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                laser.lineStyle(6, color, 0.5);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                laser.lineStyle(4, color, 0.8);
                laser.beginPath();
                laser.moveTo(playerX, playerY);
                laser.lineTo(targetX, targetY);
                laser.strokePath();

                laser.lineStyle(2, color, 1);
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
        const circle = new Phaser.Geom.Circle(enemy.x, enemy.y, 15);
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
        if (this.playerMoney >= 10) {
            this.playerMoney -= 10;
            this.playerDamage += 1;
            this.upgradeText.textContent = 'Damage increased by 1!';
            this.hudText.setText(`Level ${this.level}\nHealth: ${this.playerHealth}\nMoney: ${this.playerMoney}\nEnemies: ${this.remainingEnemies}`);
        }
    }

    buyMoreLasers() {
        const costs = [10, 15, 20, 25, 30];
        if (this.moreLasersLevel < 5 && this.playerMoney >= costs[this.moreLasersLevel]) {
            this.playerMoney -= costs[this.moreLasersLevel];
            this.moreLasersLevel++;
            this.moreLasers = true;
            this.lasers.push(this.add.graphics());
            this.upgradeText.textContent = `More lasers upgraded! Now ${this.moreLasersLevel + 1} lasers.`;
            this.hudText.setText(`Level ${this.level}\nHealth: ${this.playerHealth}\nMoney: ${this.playerMoney}\nEnemies: ${this.remainingEnemies}`);
            this.updateUpgradeButtons(); // Update button text immediately after purchase
            // Clear the upgrade text after 5 seconds
            this.time.delayedCall(5000, () => {
                this.upgradeText.textContent = '';
            });
        }
    }

    buyHealthUpgrade() {
        if (this.playerMoney >= 15) {
            this.playerMoney -= 15;
            this.playerMaxHealth += 1;
            this.upgradeText.textContent = 'Health increased by 1!';
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
        this.damageUpgradeButton.disabled = this.playerMoney < 10;
        const costs = [10, 15, 20, 25, 30];
        const currentCost = this.moreLasersLevel < 5 ? costs[this.moreLasersLevel] : 0;
        this.moreLasersButton.textContent = `MORE LASERS - Cost: ${currentCost} (${this.moreLasersLevel}/5)`;
        this.moreLasersButton.disabled = this.moreLasersLevel >= 5 || this.playerMoney < currentCost;
        this.healthUpgradeButton.disabled = this.playerMoney < 15;
    }

    showRestartConfirm() {
        this.restartConfirm.style.display = 'block';
    }

    hideRestartConfirm() {
        this.restartConfirm.style.display = 'none';
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
