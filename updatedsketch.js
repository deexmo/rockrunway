let state = "title";
let player;
let bullets = [];
let obstacles = [];
let lives = 3;
let score = 0;
let isGameOver = false;
let hasGameBegun = false;
let bgMusic;
let musicStarted = false;
let playerAnimation;
let bulletAnimation;
let strike;
let bgAnimation;

let contract;
let note;
let critics;

function preload() {
  // soundFormats('mp3', 'wav');
  bgMusic = loadSound("assets/blink.mp3");

  note = loadImage("assets/note.png");
  contract = loadImage("assets/contract.png");
  critics = loadImage("assets/overrated.png");

  let playerSprite = loadSpriteSheet("assets/player.png", 22, 34, 4);
  playerAnimation = loadAnimation(playerSprite);

  let bulletSprite = loadSpriteSheet("assets/bullet.png", 90, 20, 4)
  bulletAnimation = loadAnimation(bulletSprite);

  let bgSprite = loadSpriteSheet("assets/background.png", 520, 700, 3);
  bgAnimation = loadAnimation(bgSprite);

  strike = loadSound("assets/zap1.wav");
  strike.setVolume(0.3);
}

function setup() {
  let canvas = createCanvas(520, 700);
  canvas.parent('game-container');

  // background
  bgSprite = createSprite(width / 2, height / 2);
  bgSprite.addAnimation("scroll", bgAnimation);
  bgSprite.changeAnimation("scroll");
  bgSprite.animation.frameDelay = 8;
  bgSprite.depth = -10;

  // prevents bad quality image after scaling
  noSmooth();

  // userStartAudio();

  // prevent page from moving when using controls
  window.addEventListener("keydown", function (e) {
    const keysToBlock = [32, 37, 38, 39, 40]; // space, left, up, right, down
    if (keysToBlock.includes(e.keyCode)) {
      e.preventDefault();
    }
  });

  // creates player near bottom
  player = createSprite(95, height - 60);
  player.addAnimation("run", playerAnimation);
  player.scale = 2.5;
  player.changeAnimation("run");
  player.animation.frameDelay = 3;
  // player.shapeColor = color(100, 200, 255);
}

function draw() {
  if (state == "title") {
    title();
  } else if (state == "rungame") {
    rungame();
  } else if (state == "gameWon") {
    gameWon();
  } else if (state == "gameover") {
    gameover();
  }
}

function rungame() {
  let difficultyMultiplier = 1 + floor(score / 10) * 0.1;
  
  // centers of 110px-wide lanes
  const lanes = [95, 205, 315, 425]; 

  const obstacleTypes = [
    { width: 90, image: note, isShootable: true, scale: 0.8 },       // shootable
    { width: 100, image: contract, isShootable: false, scale: 0.7 }, // avoid
    { width: 110, image: critics, isShootable: false, scale: 1.1 }   // avoid
  ];

  // obstacleTypes[0].image = note;
  // obstacleTypes[1].image = contract;
  // obstacleTypes[2].image = critics;

  if (keyWentDown(LEFT_ARROW)) {
    player.position.x = 95;
  }
  if (keyWentDown(UP_ARROW)) {
    player.position.x = 205;
  }
  if (keyWentDown(DOWN_ARROW)) {
    player.position.x = 315;
  }
  if (keyWentDown(RIGHT_ARROW)) {
    player.position.x = 425;
  }

  // stop difficulty multiplier so it doesn't get too fast
  difficultyMultiplier = min(difficultyMultiplier, 1.5);

  // spawn frequency, decreases interval as multiplier increases
  if (frameCount % floor(50 / difficultyMultiplier) === 0) {
    let laneIndex = floor(random(lanes.length));
    let laneX = lanes[laneIndex];
    let type = random(obstacleTypes);

    if (type.width === 140 && (laneIndex === 0 || laneIndex === lanes.length - 1)) return;

    let obstacle = createSprite(laneX, -40);
    obstacle.addImage(type.image);
    obstacle.scale = type.scale;

    // obstacle.scale = 0.5; // Adjust to fit your lanes

    // Speed increases with difficulty
    obstacle.velocity.y = 5 * difficultyMultiplier;

    // Add custom property
    obstacle.isShootable = type.isShootable;

    obstacles.push(obstacle);
  }

  // collision for obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (player.overlap(obstacles[i])) {
      obstacles[i].remove();
      obstacles.splice(i, 1);
      lives--;
      if (lives == 0) {
        state = "gameover"
      }
    }
  }

  // blasts
  if (keyWentDown(" ")) {
    let bullet = createSprite(player.position.x + 2, player.position.y - 30);

    bullet.addAnimation("fire", bulletAnimation);
    bullet.changeAnimation("fire");
    bullet.scale = 1.2;
    bullet.animation.frameDelay = 5;

    strike.play();

    // bullet.shapeColor = color(255, 255, 100);
    bullet.velocity.y = -7;
    bullets.push(bullet);
  }

  // bullet and obstacle collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = obstacles.length - 1; j >= 0; j--) {
      if (
        bullets[i] &&
        bullets[i].overlap(obstacles[j]) &&
        obstacles[j].isShootable
      ) {
        bullets[i].remove();
        obstacles[j].remove();
        bullets.splice(i, 1);
        obstacles.splice(j, 1);
        score++;
        if (score >= 50) {
          state = "gameWon";
        }

        // gain a life every 10 points, max 3
        if (score % 10 === 0 && lives < 3) {
          lives++;
        }

        break; // exit inner loop since bullet is gone
      }
    }
  }

  // remove off-screen bullets
  bullets = bullets.filter(b => {
    if (b.position.y < 0) {
      b.remove();
      console.log("bullet removed");
      return false;
    }
    return true;
  });

  // remove off-screen obstacles and check for shootables
  obstacles = obstacles.filter(o => {
    if (o.position.y > height - 20) {
      if (o.isShootable) {
        lives--;
        if (lives <= 0) {
          state = "gameover";
        }
      }
      o.remove();
      return false;
    }
    return true;
  });

  drawSprites();
  drawScore();

  // lives
  for (let i = 0; i < lives; i++) {
    fill(255, 0, 0);
    rect(10 + i * 30, 10, 20, 20);
  }
}

function resetGame() {
  score = 0;
  isGameOver = false;

  // clear all obstacle sprites
  for (let obs of obstacles) {
    obs.remove();
  }
  obstacles = [];

  // clear all bullet sprites
  for (let b of bullets) {
    b.remove();
  }
  bullets = [];

  lives = 3;
}

function title() {
  background(240, 100, 100);
  textSize(60);
  textAlign(CENTER, CENTER);
  fill(255);
  noStroke();
  text("Rock Runway", width / 2, 200);
  textSize(22);
  // text("Shred your way to fame", width / 2, 260);
  textSize(30);
  text("Press Space to Play", width / 2, 400);
}

function gameWon() {
  background(0);
  textSize(30);
  textAlign(CENTER, CENTER);
  fill(255);
  noStroke();
  text("Congrats!", width / 2, 200);
  text("You Broke Through the Noise", width / 2, 240);
  text("Encore Awaits", width / 2, 280);
  textSize(25);
  text("Press Space to Try Again", width / 2, 400);
}

function gameover() {
  background(0);
  textSize(30);
  textAlign(CENTER, CENTER);
  fill(255);
  noStroke();
  text("Dream Deferred", width / 2, 200);
  text("Try Again, Rockstar", width / 2, 240);
  textSize(25);
  text("Press Space to Try Again", width / 2, 400);
}

function drawScore() {
  textSize(20);
  textAlign(CENTER, CENTER);
  fill(255);
  stroke(255);
  text("Score: " + score, width - 60, 30);
}

function keyPressed() {
  if (state === "title" && key === " ") {
    state = "rungame";

    if (!musicStarted && bgMusic) {
      // userStartAudio();
      bgMusic.setLoop(true);
      bgMusic.play();
      bgMusic.setVolume(0.7);
      musicStarted = true;
    }
  }

  if ((state === "gameover" || state === "gameWon") && key === " ") {
    resetGame();
    state = "rungame";
    lives = 3;
  }
}