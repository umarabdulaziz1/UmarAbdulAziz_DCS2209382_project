
const PLAYINGGAME = 2;
const GAMEOVER = 3;
const CENTIPEDESTARTLENGTH = 10;
const CENTIPEDESIZE = 20;
const RESETDELAY = 20;
const MAXLIVES = 3;


let gameWidth = window.innerWidth - 20;
let gameHeight = window.innerHeight - 20;
let cnv;
let player;
let centipede;
let bullets;
let keys = [];
let currentScene = PLAYINGGAME;
let levelSpeed = 1;
let level = 1;
let bulletDelay = RESETDELAY;
let gameScore = 0;
let mushrooms = [];
const TotalMushroom = 20;

function preload() {
    img = loadImage('cic.jpg'); 
  }

function setup() {
    if (gameWidth > 700) {
        gameWidth = 700;
    }   
    img.resize(80, 0);
    
    cnv = createCanvas(gameWidth, gameHeight);
    centerCanvas();
    textAlign(CENTER, CENTER);
    textSize(20);
    noCursor();

    player = new Player(width / 2, 0.75 * height, 30, 2);
    centipede = new Centipede(CENTIPEDESTARTLENGTH, CENTIPEDESIZE, levelSpeed);
    bullets = new CurrentBullets();
    spawnMushrooms();
}

function centerCanvas() {
    let x = (windowWidth - width) / 2;
    let y = (windowHeight - height) / 2;
    cnv.position(x, y);
}

function spawnMushrooms() {
    mushrooms = [];

    const mushroomsPerLevel = 20 + level * 5; 
    const minDistance = CENTIPEDESIZE * 2; 
    const safeMargin = CENTIPEDESIZE * 2; 

    for (let m = 0; m < mushroomsPerLevel; m++) {
        let valid = false;
        let attempts = 0;

        while (!valid) {
            let x = random(safeMargin, width - safeMargin);
            let y = random(safeMargin, height - safeMargin);

          
            let tooClose = false;
            for (let i = 0; i < mushrooms.length; i++) {
                let d = dist(x, y, mushrooms[i].x, mushrooms[i].y);
                if (d < minDistance) {
                    tooClose = true;
                    break;
                }
            }

            
            for (let i = 0; i < centipede.body.length; i++) {
                let d = dist(x, y, centipede.body[i].x, centipede.body[i].y);
                if (d < minDistance) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose && dist(x, y, player.x, player.y) >= player.size / 2 + CENTIPEDESIZE / 2) {
                valid = true;
                mushrooms.push(new Mushroom(x, y, CENTIPEDESIZE, 0));
            }

            
            attempts++;
            if (attempts > 100) {
                console.warn("Could not place mushroom after 100 attempts.");
                break;
            }
        }
    }
}



function showMushrooms() {
    for (let m = 0; m < mushrooms.length; m++) {
        if (!mushrooms[m].destroyed) {
            mushrooms[m].show();
        }
    }
}

function gamePlayingScene() {
    background(0);
    
   
    if (centipede.body.length < 1) {
        level++;
        spawnMushrooms();
        levelSpeed += 0.5; 
        centipede.regenerate(levelSpeed);
    }

    centipede.update();
    bullets.update(); 
    player.update();
    showMushrooms(); 

    bulletDelay--;

   
    player.checkCollideWithCentipede();
    if (player.lives < 1) {
        currentScene = GAMEOVER;
    }

    bullets.checkCollide(); 
    fill(255);
    textSize(16);
    text(`SCORE: ${gameScore} | LEVEL: ${level} | LIVES: ${player.lives}`, width / 2, 20);
}

function gameOverScene() {
    background(0, 0, 0);
    textSize(40);
    text("GAME OVER", width / 2, height / 3);
    text(`Score: ${gameScore}`, width / 2, 2 * height / 3);
}



function draw() {
    image(img, 550, 10);
    switch (currentScene) {
        case PLAYINGGAME:
            gamePlayingScene();
            break;
        case GAMEOVER:
            gameOverScene();
            break;
    }
}

function keyPressed() {
    keys[keyCode] = true;
}

function keyReleased() {
    keys[keyCode] = false;
}

function mousePressed() {
    if (mouseButton === LEFT && bulletDelay < 0) {
        bullets.shoot(player.x, player.y - player.size / 2 - 5);
    }
}

function CentipedeNode(x, y, size, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;

    this.show = function() {
        strokeWeight(2);
        stroke(255, 0, 0);
        fill(0, 255, 0);
        ellipse(this.x, this.y, this.size, this.size);
    };

    this.move = function() {
        this.x += this.speed;
        if (this.x < this.size / 2 - 2 || this.x > width - this.size / 2 + 2) {
            this.drop();
        }
    };

    this.drop = function() {
        this.speed *= -1;
        this.y += this.size + 3;
        if (this.y > height - this.size) {
            this.y = this.size + 1;
        }
    };

    this.checkCollide = function() {
        for (let m = 0; m < mushrooms.length; m++) {
            let d = dist(this.x, this.y, mushrooms[m].x, mushrooms[m].y);
            if (d < this.size + mushrooms[m].size / 2) {
                mushrooms[m].color = color(255, 0, 0);
                this.speed *= -1;
                this.y += this.size + 1;
            }
        }
    };

    this.update = function() {
        this.move();
        this.show();
        this.checkCollide();
    };
}




function CurrentBullets() {
    this.bullets = [];

    this.shoot = function(x, y) {
        this.bullets.push(new Bullet(x, y, 5, 10));
        bulletDelay = RESETDELAY;
    };

    this.update = function() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    };

    this.checkCollide = function() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let bulletHit = false;

            
            for (let j = centipede.body.length - 1; j >= 0; j--) {
                if (this.bullets[i].hits(centipede.body[j])) {
                    this.bullets.splice(i, 1);
                    centipede.body.splice(j, 1);
                    gameScore += 10; 
                    bulletHit = true;
                    break;
                }
            }

         
            if (!bulletHit) {
                for (let m = mushrooms.length - 1; m >= 0; m--) {
                    if (this.bullets[i].hits(mushrooms[m])) {
                        this.bullets.splice(i, 1);
                        mushrooms.splice(m, 1); 
                        console.log("Bullet hit mushroom!");
                        break; 
                    }
                }
            }
        }
    };
}


function Mushroom(x, y, size, c) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.c = c;
    this.destroyed = false; 

    this.show = function() {
        if (!this.destroyed) {
            strokeWeight(2);
            stroke(200, 200, 195);
            fill(255,0,0);
            ellipse(this.x, this.y, this.size, this.size);
            rect(this.x - this.size / 3, this.y + this.size / 2 - 5, 2 * this.size / 3, 7);
        }
    };

    this.destroy = function() {
        this.destroyed = true;
    };
}

function Player(x, y, size, speed) {
    
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed * 1.2;
    this.lives = MAXLIVES;

    // Movements
    this.move = function() {
        let newX = this.x;
        let newY = this.y;

        if (keys[LEFT_ARROW]) {
            newX -= this.speed;
        }
        
        if (keys[RIGHT_ARROW]) {
            newX += this.speed;
        }
        
        if (keys[UP_ARROW]) {
            newY -= this.speed;
        }

        if (keys[DOWN_ARROW]) {
            newY += this.speed;
        }

        // newX = constrain(newX, this.size / 2, width - this.size / 2);
        // newY = constrain(newY, 0.75 * height, height - this.size / 2);

        
        let canMoveX = true;
        let canMoveY = true;
        
        for (let m = 0; m < mushrooms.length; m++) {
            if (!mushrooms[m].destroyed) {
                let d = dist(newX, newY, mushrooms[m].x, mushrooms[m].y);
                if (d < this.size / 2 + mushrooms[m].size / 2) {
                  
                    if (abs(newX - this.x) > abs(newY - this.y)) {
                        
                        canMoveX = false;
                    } else {
                        
                        canMoveY = false;
                    }
                    break; 
                }
            }
        }

        if (canMoveX) {
            this.x = newX;
        }
        if (canMoveY) {
            this.y = newY;
        }

    
        if (keys[32] && bulletDelay < 0) {
            bullets.shoot(this.x, this.y - this.size / 2 - 5);
            bulletDelay = RESETDELAY; 
        }
    };

 
    this.show = function() {
        noStroke();
        fill(255, 255, 255);
        rect(this.x - 2, this.y - this.size / 2 - 5, 4, 6); 
        ellipse(this.x, this.y, this.size, this.size); 
    };

  
    this.checkCollideWithCentipede = function() {
        for (let c = 0; c < centipede.body.length; c++) {
            let d = dist(this.x, this.y, centipede.body[c].x, centipede.body[c].y);
            if (d < this.size / 2 + centipede.body[c].size / 2) {
                this.lives--;
                this.y = 0.75 * height;
                this.x = width / 2;
                centipede.regenerate(centipede.speed);
            }
        }
    };


    this.update = function() {
        this.move();
        this.show();
    };
}





function Bullet(x, y, size, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;

    this.show = function() {
        noStroke();
        fill(255, 0, 0);
        ellipse(this.x, this.y, this.size, this.size);
    };

    this.update = function() {
        this.y -= this.speed;
        this.show();
    };

    this.hits = function(target) {
        let d = dist(this.x, this.y, target.x, target.y);
        return d < this.size / 2 + target.size / 2;
    };
}


function Centipede(length, size, speed) {
    this.size = size;
    this.length = length;
    this.speed = speed;
    this.body = [];

    this.regenerate = function(speed) {
        this.speed = speed;
        this.body = [];
        for (let i = 0; i < this.length; i++) {
            this.body.push(new CentipedeNode(i * (this.size + 4) + this.size, 4 * this.size, this.size, this.speed));
        }
    };

    this.update = function() {
        for (let i = 0; i < this.body.length; i++) {
            this.body[i].update();
        }
    };

    this.regenerate(this.speed);
}


