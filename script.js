// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    width: 50,
    height: 50,
    speed: 6,
    lives: 3,
    score: 0,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    image: new Image(),
};

let level = 1;
let enemySpeed = 1;
let bigEnemyActive = false;
let bossDirection = 1;
let bossShootingInterval = null;
let gameWon = false;

// Load images
player.image.src = 'rocket.png';
const heartImage = new Image();
heartImage.src = 'heart.png';
const smallEnemyImage = new Image();
smallEnemyImage.src = 'alien.png';
const bigEnemyImage = new Image();
bigEnemyImage.src = 'boss-alien.png';
const enemyImageLevel2 = new Image();
enemyImageLevel2.src = 'big-alien.png';
const enemyImageLevel3 = new Image();
enemyImageLevel3.src = 'big-big-alien.png';
const heartBonusImage = new Image();
heartBonusImage.src = 'heartBonus.png';
const speedBonusImage = new Image();
speedBonusImage.src = 'speedBonus.png';
const bossImageLevel3 = new Image();
bossImageLevel3.src = 'super-boss-alien.png';

// Game objects
const bullets = [];
const enemies = [];
const bigEnemies = [];
const bossBullets = [];
const enemyBullets = [];

// Bonus items
const bubble = {
    x: -100,
    y: -100,
    width: 30,
    height: 30,
    isActive: false,
};

const speedBoost = {
    x: -100,
    y: -100,
    width: 30,
    height: 30,
    isActive: false,
};

// Game functions
function drawBackground() {
    if (level === 1) {
        document.body.style.backgroundImage = "url('space.jpg')";
    } else if (level === 2) {
        document.body.style.backgroundImage = "url('space2.jpg')";
    } else if (level === 3) {
        document.body.style.backgroundImage = "url('space3.jpg')";
    }
}

function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function drawBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
}

function drawBossBullets() {
    bossBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        ctx.fillStyle = 'blue';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (bullet.y > canvas.height) {
            bossBullets.splice(index, 1);
        }

        // Check collision with player
        if (checkCollision(bullet, player)) {
            bossBullets.splice(index, 1);
            player.lives--;
            checkGameOver();
        }
    });
}

function drawEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy reaches bottom
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            player.lives--;
            checkGameOver();
        }

        // Collision with player
        if (checkCollision(enemy, player)) {
            enemies.splice(index, 1);
            player.lives--;
            checkGameOver();
        }

        // Enemy shooting
        if (enemy.canShoot && Math.random() < 0.02) {
            enemyFire(enemy);
        }

        // Bullet hits enemy
        bullets.forEach((bullet, bIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemy.health--;
                bullets.splice(bIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(index, 1);
                    player.score++;

                    // Check for boss spawn conditions
                    checkBossSpawnConditions();
                }
            }
        });
    });
}

function checkBossSpawnConditions() {
    if (level === 1 && player.score >= 20 && !bigEnemyActive) {
        startBossFight();
    } else if (level === 2 && player.score >= 80 && !bigEnemyActive) {
        startBossFight();
    }
}

function startBossFight() {

    enemies.length = 0;
    bigEnemyActive = true;
    spawnBigEnemy();


    if (bossShootingInterval) {
        clearInterval(bossShootingInterval);
    }
    bossShootingInterval = setInterval(fireBossBullet, 1000);
}

function enemyFire(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 7,
        height: 10,
        speed: 5,
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (checkCollision(bullet, player)) {
            player.lives--;
            enemyBullets.splice(index, 1);
            checkGameOver();
        }

        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });
}

function drawBigEnemies() {
    bigEnemies.forEach((enemy, index) => {
        enemy.x += bossDirection * 3;
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            bossDirection *= -1;
        }

        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);

        if (checkCollision(enemy, player)) {
            bigEnemies.splice(index, 1);
            player.lives -= 2; 
            checkGameOver();
            endBossFight();
        }

        bullets.forEach((bullet, bIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemy.health--;
                bullets.splice(bIndex, 1);

                if (enemy.health <= 0) {
                    bigEnemies.splice(index, 1);
                    player.score += 5;
                    endBossFight();
                    if (level === 3) {
                        gameWon = true;
                    }
                    advanceLevel();
                }
            }
        });
    });
}

function endBossFight() {
    bigEnemyActive = false;
    if (bossShootingInterval) {
        clearInterval(bossShootingInterval);
        bossShootingInterval = null;
    }
    bossBullets.length = 0;
}

function advanceLevel() {
    level++;
    enemySpeed *= 1.2;
    player.lives += 2; 

    drawBackground();

    if (level === 3) {
        startBossFight();
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + player.score, 10, 30);
    ctx.fillText('Level: ' + level, 10, 60);
}

function drawLives() {
    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(heartImage, 10 + i * 35, 80, 30, 30);
    }
}

function drawGameWonMessage() {
    if (gameWon) {
        ctx.fillStyle = 'yellow';
        ctx.font = '40px Arial';
        ctx.fillText('Game Won! Congratulations!', canvas.width / 2 - 220, canvas.height / 2);
    }
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function checkGameOver() {
    if (player.lives <= 0) {
        alert('GAME OVER! Final Score: ' + player.score);
        document.location.reload();
    }
}

function spawnEnemy() {
    if (!bigEnemyActive) {
        if (level === 1) {
            enemies.push({
                x: Math.random() * (canvas.width - 40),
                y: -40,
                width: 40,
                height: 40,
                speed: enemySpeed,
                image: smallEnemyImage,
                health: 1,
                canShoot: false,
            });
        } else if (level === 2) {
            enemies.push({
                x: Math.random() * (canvas.width - 40),
                y: -40,
                width: 40,
                height: 40,
                speed: enemySpeed,
                image: enemyImageLevel2,
                health: 2,
                canShoot: player.score >= 40 && Math.random() < 0.3,
            });
        } else if (level === 3) {
            enemies.push({
                x: Math.random() * (canvas.width - 40),
                y: -40,
                width: 40,
                height: 40,
                speed: enemySpeed * 1.5,
                image: enemyImageLevel3,
                health: 2,
                canShoot: true,
            });
        }
    }
}

function spawnBigEnemy() {
    if (level === 1 || level === 2) {
        bigEnemies.push({
            x: canvas.width / 2 - 40,
            y: 50,
            width: 80,
            height: 80,
            speed: 0,
            health: level === 1 ? 20 : 30,
            image: level === 1 ? bigEnemyImage : enemyImageLevel2,
        });
    } else if (level === 3) {
        bigEnemies.push({
            x: canvas.width / 2 - 60,
            y: 30,
            width: 120,
            height: 120,
            speed: 0,
            health: 50,
            image: bossImageLevel3,
        });
    }
}

function spawnBubble() {
    if (!bubble.isActive && !bigEnemyActive) {
        bubble.x = Math.random() * (canvas.width - bubble.width);
        bubble.y = Math.random() * (canvas.height - bubble.height);
        bubble.isActive = true;

        setTimeout(() => {
            bubble.isActive = false;
        }, Math.random() * (8000 - 3000) + 3000);
    }
}

function drawBubble() {
    if (bubble.isActive) {
        ctx.drawImage(heartBonusImage, bubble.x, bubble.y, bubble.width, bubble.height);
    }
}

function checkBubbleCollision() {
    if (checkCollision(player, bubble) && bubble.isActive) {
        player.lives++;
        bubble.isActive = false;
    }
}

function spawnSpeedBoost() {
    if (!speedBoost.isActive && !bigEnemyActive) {
        speedBoost.x = Math.random() * (canvas.width - speedBoost.width);
        speedBoost.y = Math.random() * (canvas.height - speedBoost.height);
        speedBoost.isActive = true;

        setTimeout(() => {
            speedBoost.isActive = false;
        }, 5000);
    }
}

function drawSpeedBoost() {
    if (speedBoost.isActive) {
        ctx.drawImage(speedBonusImage, speedBoost.x, speedBoost.y, speedBoost.width, speedBoost.height);
    }
}

function checkSpeedBoostCollision() {
    if (checkCollision(player, speedBoost) && speedBoost.isActive) {
        player.speed *= 1.5;
        setTimeout(() => {
            player.speed /= 1.5;
        }, 5000);
        speedBoost.isActive = false;
    }
}

function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
        player.movingLeft = true;
    }
    if (event.key === 'ArrowRight') {
        player.movingRight = true;
    }
    if (event.key === 'ArrowUp') {
        player.movingUp = true;
    }
    if (event.key === 'ArrowDown') {
        player.movingDown = true;
    }
    if (event.key === ' ') {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        });
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowLeft') {
        player.movingLeft = false;
    }
    if (event.key === 'ArrowRight') {
        player.movingRight = false;
    }
    if (event.key === 'ArrowUp') {
        player.movingUp = false;
    }
    if (event.key === 'ArrowDown') {
        player.movingDown = false;
    }
}

function fireBossBullet() {
    // Assuming that there is only one boss active at a time
    const boss = bigEnemies[0]; 
    // Define the bullet's initial position and other properties
    const bullet = {
        x: boss.x + boss.width / 2 - 5, // Start bullet at the center of the boss
        y: boss.y + boss.height, // Start bullet just below the boss
        width: 10, // Bullet width
        height: 20, // Bullet height
        speed: 5, // Bullet speed
    };

    // Add the bullet to the bossBullets array
    bossBullets.push(bullet);
}


function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player movement
    if (player.movingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.movingRight && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    if (player.movingUp && player.y > 0) {
        player.y -= player.speed;
    }
    if (player.movingDown && player.y + player.height < canvas.height) {
        player.y += player.speed;
    }

    drawBackground();
    drawPlayer();
    drawBullets();
    drawBossBullets();
    drawEnemies();
    drawBigEnemies();
    drawScore();
    drawLives();
    drawEnemyBullets();

    if (!bigEnemyActive) {
        drawBubble();
        checkBubbleCollision();
        drawSpeedBoost();
        checkSpeedBoostCollision();
    }

    drawGameWonMessage();

    requestAnimationFrame(update);
}


setInterval(spawnEnemy, 1000);
setInterval(spawnBubble, 10000);
setInterval(spawnSpeedBoost, 15000);
update();


function cheaty() {
    player.score += 5;
}

function cheaty2() {
    player.lives += 5;
}
