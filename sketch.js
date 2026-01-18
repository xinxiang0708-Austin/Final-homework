let balls = [];      // 普通小球
let bigBalls = [];   // 大球
let bombs = [];      // 炸弹
let particles = [];  // 所有粒子效果
let gameStage = 1;   // 1:小球简单模式, 2:大球奖励模式, 4:交替模式
let gameStageStartTime = 0; // 当前阶段开始时间
let bigBallModeDuration = 10000; // 大球模式持续时间（10秒）
let ballClickCount = 0; // 小球点击计数（用于触发大球模式）
let lastBallSpawnTime = 0; // 上次生成物体的时间
let ballSpawnInterval = 1000; // 物体生成间隔（1秒）
let score = 0; // 游戏得分
let hearts = 2; // 生命值 - 改为2，点到两次炸弹游戏结束
let isGameOver = false; // 游戏是否结束
let gameStarted = false; // 游戏是否已开始
let gridSpacing = 50; // 网格间距
let shakeIntensity = 0; // 震动强度
let shakeDuration = 0; // 震动持续时间
let shakeTimer = 0; // 震动计时器

function setup() {
  createCanvas(800, 600).parent('game-container');
  gameStageStartTime = millis();
  // 初始小球
  for (let i = 0; i < 3; i++) createRandomBall();
}

function draw() {
  // 更新震动效果
  updateShake();
  push();
  // 应用震动偏移
  if (shakeIntensity > 0) translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
  
  // 检查游戏是否已开始
  if (!gameStarted) { 
    drawStartScreen(); 
    pop(); 
    return; 
  }
  if (isGameOver) { 
    drawGameOver(); 
    pop(); 
    return; 
  }
  
  // 绘制背景和网格
  background(8, 8, 20);
  drawGrid();
  
  // 游戏阶段逻辑
  updateGameStage();
  
  // 根据当前阶段更新游戏
  if (gameStage === 1) updateSimpleBallMode(); // 小球简单模式
  else if (gameStage === 2) updateBigBallMode(); // 大球奖励模式
  else if (gameStage === 4) updateAlternateMode(); // 交替模式
  
  // 更新和显示所有物体
  updateAndDisplayObjects();
  
  // 显示游戏信息
  displayGameInfo();
  
  // 显示阶段提示
  displayStageHint();
  pop();
}

function mousePressed() {
  // 如果游戏未开始，点击任意位置开始游戏
  if (!gameStarted) { 
    gameStarted = true; 
    gameStageStartTime = millis(); 
    return; 
  }
  
  if (isGameOver) { 
    if (isRestartButtonClicked()) resetGame(); 
    return; 
  }
  
  let clicked = false;
  
  // 检查小球点击
  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].contains(mouseX, mouseY)) {
      createFirework(balls[i].x, balls[i].y, balls[i].color, 1); // 创建烟花效果
      balls.splice(i, 1); // 移除小球
      score += 1; // 增加得分
      ballClickCount++; // 增加点击计数
      clicked = true;
      break;
    }
  }
  
  // 检查大球点击
  if (!clicked) {
    for (let i = bigBalls.length - 1; i >= 0; i--) {
      if (bigBalls[i].contains(mouseX, mouseY)) {
        createFirework(bigBalls[i].x, bigBalls[i].y, bigBalls[i].color, 2); // 创建大烟花效果
        bigBalls.splice(i, 1); // 移除大球
        score += 5; // 大球得分更高
        // 大球模式下，点击后立即生成新的大球
        if (gameStage === 2) setTimeout(() => { 
          if (gameStage === 2) createBigBall(); 
        }, 300);
        clicked = true;
        break;
      }
    }
  }
  
  // 检查炸弹点击（只在交替模式）
  if (!clicked && gameStage === 4) {
    for (let i = bombs.length - 1; i >= 0; i--) {
      if (bombs[i].contains(mouseX, mouseY)) {
        triggerShake(10, 500); // 触发震动效果
        createSmallBombExplosion(bombs[i].x, bombs[i].y); // 创建炸弹爆炸效果
        bombs.splice(i, 1); // 移除炸弹
        hearts--; // 减少生命值
        if (hearts <= 0) isGameOver = true; // 生命值为0时游戏结束
        return;
      }
    }
  }
}

function mouseMoved() {
  // 更新重新开始按钮的悬停状态
  if (isGameOver) restartButton.isHovered = isRestartButtonClicked();
}


// 绘制开始界面
function drawStartScreen() {
  background(8, 8, 20);
  drawGrid();
  
  // 显示初始小球（静止状态）
  for (let ball of balls) ball.displayStartScreen();
  
  // 显示游戏标题
  textSize(64); textStyle(BOLD); fill(255, 255, 200);
  textAlign(CENTER, CENTER); text("BALL GAME", width/2, height/2 - 80);
  
  // 显示开始提示
  textSize(32); fill(200, 220, 255);
  text("Click anywhere to start", width/2, height/2);
}

// 触发震动效果
function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeTimer = millis();
}

// 更新震动效果
function updateShake() {
  if (shakeIntensity > 0 && millis() - shakeTimer < shakeDuration) {
    // 逐渐减弱震动强度
    let progress = (millis() - shakeTimer) / shakeDuration;
    shakeIntensity = 10 * (1 - progress);
  } else {
    shakeIntensity = 0;
  }
}

// 重新开始按钮
let restartButton = { 
  x: 0, // 按钮X坐标
  y: 0, // 按钮Y坐标
  width: 200, // 按钮宽度
  height: 50, // 按钮高度
  isHovered: false // 按钮是否被悬停
};

// 绘制重新开始按钮
function drawRestartButton() {
  // 设置按钮位置（屏幕中央下方）
  restartButton.x = width/2;
  restartButton.y = height/2 + 80;
  
  push();
  // 根据悬停状态设置按钮颜色
  fill(restartButton.isHovered ? color(100, 200, 100) : color(80, 180, 80));
  noStroke(); 
  rectMode(CENTER); // 以中心点为基准绘制矩形
  rect(restartButton.x, restartButton.y, restartButton.width, restartButton.height, 10); // 绘制圆角矩形
  
  // 绘制按钮文字
  fill(255, 255, 255); 
  textSize(24); 
  textStyle(BOLD);
  textAlign(CENTER, CENTER); 
  text("RESTART", restartButton.x, restartButton.y);
  pop();
}

// 检查是否点击了重新开始按钮
function isRestartButtonClicked() {
  return mouseX > restartButton.x - restartButton.width/2 &&
         mouseX < restartButton.x + restartButton.width/2 &&
         mouseY > restartButton.y - restartButton.height/2 &&
         mouseY < restartButton.y + restartButton.height/2;
}

// 绘制网格
function drawGrid() {
  stroke(60, 60, 80, 30); 
  strokeWeight(0.5);
  // 绘制垂直线
  for (let x = 0; x <= width; x += gridSpacing) line(x, 0, x, height);
  // 绘制水平线
  for (let y = 0; y <= height; y += gridSpacing) line(0, y, width, y);
}

//游戏阶段管理
function updateGameStage() {
  // 检查是否需要切换到阶段2（大球奖励模式）
  if (gameStage === 1 && ballClickCount >= 10) {
    gameStage = 2;
    gameStageStartTime = millis();
    ballClickCount = 0;
    // 清空所有小球，准备大球模式
    balls = []; 
    particles = []; 
    bombs = [];
    // 生成第一个大球
    createBigBall();
  } 
  // 检查大球模式是否结束（持续10秒）
  else if (gameStage === 2 && millis() - gameStageStartTime > bigBallModeDuration) {
    gameStage = 4; // 直接进入交替模式（跳过阶段3）
    gameStageStartTime = millis();
    // 清空大球
    bigBalls = []; 
    particles = [];
    // 生成第一个物体
    spawnAlternateObject();
  }
}

// 更新小球简单模式
function updateSimpleBallMode() {
  // 定期生成小球（每1秒）
  if (millis() - lastBallSpawnTime > ballSpawnInterval) {
    createRandomBall();
    lastBallSpawnTime = millis();
  }
}

// 更新大球奖励模式
function updateBigBallMode() {
  // 大球模式：只有一个大球存在，点击后立即生成下一个
  if (bigBalls.length === 0) createBigBall();
}

// 更新交替模式
function updateAlternateMode() {
  // 交替模式：定期生成随机物体（加速生成）
  if (millis() - lastBallSpawnTime > ballSpawnInterval * 0.8) {
    spawnAlternateObject();
    lastBallSpawnTime = millis();
  }
}

// 生成交替模式的随机物体
function spawnAlternateObject() {
  let r = random(); // 生成随机数
  if (r < 0.5) createRandomBall(); // 50%概率生成小球
  else if (r < 0.8) createBigBall(); // 30%概率生成大球
  else createBomb(); // 20%概率生成炸弹
}

//物体创建函数
// 创建随机小球
function createRandomBall() {
  let edge = floor(random(3)); // 随机选择生成边缘（0:左, 1:右, 2:下）
  let size = random(18, 25); // 随机大小
  let speed = random(5, 8); // 随机水平速度
  let verticalSpeed = random(-7, -10); // 随机垂直速度（向上）
  let x, y, vx, vy;
  
  if (edge === 0) {
    x = -size; 
    y = random(height * 0.3, height * 0.7);
    vx = speed; 
    vy = verticalSpeed;
  } else if (edge === 1) {
    x = width + size; 
    y = random(height * 0.3, height * 0.7);
    vx = -speed; 
    vy = verticalSpeed;
  } else {
    x = random(width); 
    y = height + size;
    vx = random(-1.5, 1.5); 
    vy = verticalSpeed * 0.8;
  }
  
  // 创建随机颜色的小球
  let ballColor = color(random(160, 230), random(160, 230), random(160, 230));
  balls.push(new Ball(x, y, vx, vy, size, ballColor, false));
}

// 创建大球
function createBigBall() {
  // 大球从下边缘中央区域向上抛出
  let x = random(width * 0.3, width * 0.7);
  let y = height + 30;
  let vx = random(-0.5, 0.5);
  let vy = random(-12, -16); // 更大的向上速度，抛得更高
  let size = random(45, 60);
  // 创建大球颜色（偏暖色调）
  let ballColor = color(random(220, 255), random(120, 200), random(50, 150));
  bigBalls.push(new Ball(x, y, vx, vy, size, ballColor, true));
}

// 创建炸弹
function createBomb() {
  let edge = floor(random(3)); // 随机选择生成边缘
  let size = random(22, 28); // 炸弹大小
  let speed = random(4, 7); // 炸弹速度
  let verticalSpeed = random(-6, -9); // 炸弹垂直速度
  let x, y, vx, vy;
  
  if (edge === 0) {
    x = -size; 
    y = random(height * 0.3, height * 0.7);
    vx = speed; 
    vy = verticalSpeed;
  } else if (edge === 1) {
    x = width + size; 
    y = random(height * 0.3, height * 0.7);
    vx = -speed; 
    vy = verticalSpeed;
  } else {
    x = random(width); 
    y = height + size;
    vx = random(-1.5, 1.5); 
    vy = verticalSpeed * 0.8;
  }
  bombs.push(new Bomb(x, y, vx, vy, size));
}

// 创建烟花效果
function createFirework(x, y, baseColor, type) {
  let particleCount, explosionSpeed, particleSize;
  
  if (type === 1) {
    // 小球烟花
    particleCount = floor(random(30, 50));
    explosionSpeed = random(2.5, 5);
    particleSize = random(2.5, 5);
  } else {
    // 大球烟花
    particleCount = floor(random(100, 150));
    explosionSpeed = random(8, 15);
    particleSize = random(6, 10);
  }
  
  for (let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI);
    let vx = cos(angle) * explosionSpeed * random(0.7, 1.3);
    let vy = sin(angle) * explosionSpeed * random(0.7, 1.3);
    // 基于基础颜色创建变化的颜色
    let shift = random(-20, 20);
    let particleColor = color(
      red(baseColor) + shift,
      green(baseColor) + shift * 0.7,
      blue(baseColor) + shift * 0.4
    );
    particles.push(new FireworkParticle(x, y, vx, vy, particleSize, particleColor));
  }
}

// 创建小范围炸弹爆炸效果
function createSmallBombExplosion(x, y) {
  for (let i = 0; i < random(30, 50); i++) {
    let angle = random(TWO_PI);
    let vx = cos(angle) * random(2, 6);
    let vy = sin(angle) * random(2, 6);
    // 火焰颜色：红、橙、黄
    let flameColor = random([
      color(255, 50, 0),    // 红色
      color(255, 100, 0),   // 橙色
      color(255, 150, 0),   // 橙黄色
    ]);
    let particleSize = random(3, 6);
    particles.push(new FireParticle(x, y, vx, vy, particleSize, flameColor));
  }
}

//物体更新和显示
function updateAndDisplayObjects() {
  // 只有在游戏开始时才更新物体位置
  if (!gameStarted) return;
  
  // 更新和显示小球、大球和炸弹
  [balls, bigBalls, bombs].forEach(arr => {
    arr.forEach(obj => { 
      obj.update(); 
      obj.display(); 
    });
  });
  
  // 更新和显示粒子效果
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

//游戏信息显示
function displayGameInfo() {
  // 左上角分数显示
  fill(255, 255, 200); 
  noStroke(); 
  textSize(24); 
  textStyle(BOLD);
  textAlign(LEFT, TOP); 
  text(`SCORE: ${score}`, 20, 20);
  
  // 左上角生命值显示
  fill(255, 100, 100); 
  text(`❤️ ${hearts}`, 20, 55);
  
  // 小球模式显示点击计数
  if (gameStage === 1) {
    fill(200, 220, 255); 
    textSize(16);
    text(`Balls clicked: ${ballClickCount}/10`, 20, 90);
  }
}

function displayStageHint() {
  // 交替模式显示炸弹警告
  if (gameStage === 4) {
    fill(255, 50, 50); 
    noStroke(); 
    textSize(18); 
    textStyle(BOLD);
    textAlign(RIGHT, TOP); 
    text("⚠️ Avoid bombs!", width - 20, 20);
  }
  
  // 大球模式显示剩余时间
  if (gameStage === 2) {
    let timeLeft = max(0, bigBallModeDuration - (millis() - gameStageStartTime));
    text(`Time left: ${nf(timeLeft/1000, 0, 1)}s`, width/2, 45);
  }
}

//游戏结束画面
function drawGameOver() {
  // 半透明黑色背景
  background(20, 0, 0, 200);
  // 添加深色覆盖层
  fill(0, 0, 0, 150); 
  noStroke(); 
  rect(0, 0, width, height);
  
  // 显示"游戏结束"文字
  fill(255, 50, 50); 
  noStroke(); 
  textSize(64); 
  textStyle(BOLD);
  textAlign(CENTER, CENTER); 
  text("GAME OVER", width/2, height/2 - 50);
  
  // 显示最终得分
  textSize(36); 
  fill(255, 200, 100);
  text(`Final Score: ${score}`, width/2, height/2 + 20);
  
  // 绘制重新开始按钮
  drawRestartButton();
}

//重置游戏
function resetGame() {
  // 重置所有游戏状态
  balls = []; 
  bigBalls = []; 
  bombs = []; 
  particles = [];
  gameStage = 1; 
  gameStageStartTime = millis(); 
  ballClickCount = 0;
  score = 0; 
  hearts = 2; // 重置为2次机会
  isGameOver = false; 
  gameStarted = true; // 游戏直接开始
  // 创建初始小球
  for (let i = 0; i < 3; i++) createRandomBall();
}

//类定义
class Ball {
  constructor(x, y, vx, vy, size, color, isBig) {
    this.x = x; // X坐标
    this.y = y; // Y坐标
    this.size = size; // 大小
    this.color = color; // 颜色
    this.isBig = isBig; // 是否为大球
    this.vx = gameStarted ? vx : 0; // X轴速度（游戏开始前为0）
    this.vy = gameStarted ? vy : 0; // Y轴速度（游戏开始前为0）
    this.gravity = isBig ? 0.05 : 0.15; // 重力（大球重力较小）
    this.elasticity = isBig ? 0.7 : 0.8; // 弹性系数
    this.trail = []; // 拖尾效果数组
    this.maxTrailLength = isBig ? 25 : 15; // 最大拖尾长度
    this.rotation = 0; // 旋转角度
    this.rotationSpeed = random(-0.03, 0.03); // 旋转速度
    this.originalVx = vx; // 保存原始速度
    this.originalVy = vy; // 保存原始速度
  }
  
  update() {
    // 如果游戏未开始，不更新位置
    if (!gameStarted) return;
    
    // 如果游戏刚开始，设置速度
    if (gameStarted && this.vx === 0 && this.vy === 0) {
      this.vx = this.originalVx;
      this.vy = this.originalVy;
    }
    
    // 保存当前位置到拖尾
    this.trail.push({ 
      x: this.x, 
      y: this.y, 
      size: this.size * 0.7, 
      alpha: 200 
    });
    
    // 更新拖尾透明度和大小
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = map(i, 0, this.trail.length, 50, 180);
      this.trail[i].size *= 0.95;
    }
    
    // 限制拖尾长度
    if (this.trail.length > this.maxTrailLength) this.trail.shift();
    
    // 物理更新
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // 边界碰撞检测
    if (this.x < this.size) { 
      this.x = this.size; 
      this.vx = -this.vx * this.elasticity; 
    } else if (this.x > width - this.size) { 
      this.x = width - this.size; 
      this.vx = -this.vx * this.elasticity; 
    }
    
    if (this.y < this.size) { 
      this.y = this.size; 
      this.vy = -this.vy * this.elasticity; 
    } else if (this.y > height - this.size) { 
      this.y = height - this.size; 
      this.vy = -this.vy * this.elasticity; 
    }
    
    // 移出屏幕外的大球（防止内存泄漏）
    if (this.isBig && (this.y > height + 100 || this.x < -100 || this.x > width + 100)) {
      let index = bigBalls.indexOf(this);
      if (index !== -1) bigBalls.splice(index, 1);
    }
  }
  
  display() {
    // 绘制拖尾
    for (let point of this.trail) {
      fill(red(this.color), green(this.color), blue(this.color), point.alpha * 0.4);
      noStroke(); 
      ellipse(point.x, point.y, point.size * 1.8);
    }
    
    push();
    translate(this.x, this.y); 
    rotate(this.rotation);
    
    // 添加发光效果
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(red(this.color), green(this.color), blue(this.color), 100);
    
    // 绘制球体
    fill(this.color); 
    noStroke(); 
    ellipse(0, 0, this.size * 2);
    
    // 绘制高光
    fill(255, 255, 255, 150); 
    ellipse(-this.size * 0.25, -this.size * 0.25, this.size * 0.5, this.size * 0.5);
    
    drawingContext.shadowBlur = 0;
    pop();
  }
  
  // 开始界面显示（不显示拖尾）
  displayStartScreen() {
    push();
    translate(this.x, this.y); 
    rotate(this.rotation);
    fill(this.color); 
    noStroke(); 
    ellipse(0, 0, this.size * 2);
    fill(255, 255, 255, 150); 
    ellipse(-this.size * 0.25, -this.size * 0.25, this.size * 0.5, this.size * 0.5);
    pop();
  }
  
  // 检测点是否在球内
  contains(px, py) { 
    return dist(px, py, this.x, this.y) < this.size; 
  }
}

class Bomb {
  constructor(x, y, vx, vy, size) {
    this.x = x; // X坐标
    this.y = y; // Y坐标
    this.size = size; // 大小
    this.vx = gameStarted ? vx : 0; // X轴速度
    this.vy = gameStarted ? vy : 0; // Y轴速度
    this.gravity = 0.15; // 重力
    this.elasticity = 0.8; // 弹性系数
    this.trail = []; // 火焰拖尾数组
    this.maxTrailLength = 12; // 最大拖尾长度
    this.rotation = 0; // 旋转角度
    this.rotationSpeed = random(-0.04, 0.04); // 旋转速度
    this.originalVx = vx; // 保存原始速度
    this.originalVy = vy; // 保存原始速度
  }
  
  update() {
    // 如果游戏未开始，不更新位置
    if (!gameStarted) return;
    
    // 如果游戏刚开始，设置速度
    if (gameStarted && this.vx === 0 && this.vy === 0) {
      this.vx = this.originalVx;
      this.vy = this.originalVy;
    }
    
    // 保存当前位置到拖尾（火焰效果）
    this.trail.push({ 
      x: this.x, 
      y: this.y, 
      size: this.size * 0.8, 
      alpha: 220 
    });
    
    // 更新拖尾
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = map(i, 0, this.trail.length, 30, 180);
      this.trail[i].size *= 0.9;
    }
    
    // 限制拖尾长度
    if (this.trail.length > this.maxTrailLength) this.trail.shift();
    
    // 物理更新
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // 边界碰撞检测
    if (this.x < this.size) { 
      this.x = this.size; 
      this.vx = -this.vx * this.elasticity; 
    } else if (this.x > width - this.size) { 
      this.x = width - this.size; 
      this.vx = -this.vx * this.elasticity; 
    }
    
    if (this.y < this.size) { 
      this.y = this.size; 
      this.vy = -this.vy * this.elasticity; 
    } else if (this.y > height - this.size) { 
      this.y = height - this.size; 
      this.vy = -this.vy * this.elasticity; 
    }
  }
  
  display() {
    // 绘制火焰拖尾
    for (let point of this.trail) {
      fill(255, 100 + point.alpha * 0.3, 0, point.alpha * 0.5);
      noStroke(); 
      ellipse(point.x, point.y, point.size * 1.5);
    }
    
    push();
    translate(this.x, this.y); 
    rotate(this.rotation);
    
    // 绘制炸弹主体
    fill(255, 50, 50); 
    noStroke(); 
    ellipse(0, 0, this.size * 2);
    
    // 绘制炸弹细节
    fill(40, 40, 40); 
    rect(-this.size * 0.3, -this.size * 0.1, this.size * 0.6, this.size * 0.2);
    
    // 绘制引信（火焰效果）
    fill(255, 150, 0); 
    triangle(-this.size * 0.1, -this.size * 0.8, 
             this.size * 0.1, -this.size * 0.8, 
             0, -this.size * 1.2);
    
    // 绘制危险符号
    stroke(255, 255, 0); 
    strokeWeight(3); 
    noFill();
    line(-this.size * 0.4, -this.size * 0.4, this.size * 0.4, this.size * 0.4);
    line(this.size * 0.4, -this.size * 0.4, -this.size * 0.4, this.size * 0.4);
    pop();
  }
  
  // 检测点是否在炸弹内
  contains(px, py) { 
    return dist(px, py, this.x, this.y) < this.size; 
  }
}

class FireworkParticle {
  constructor(x, y, vx, vy, size, color) {
    this.x = x; // X坐标
    this.y = y; // Y坐标
    this.vx = vx; // X轴速度
    this.vy = vy; // Y轴速度
    this.size = size; // 粒子大小
    this.color = color; // 粒子颜色
    this.createdTime = millis(); // 创建时间
    this.lifespan = 2000; // 生命周期（毫秒）
    this.gravity = 0.1; // 重力
    this.decay = random(0.97, 0.99); // 速度衰减系数
    this.trail = []; // 拖尾数组
  }
  
  update() {
    // 保存拖尾
    this.trail.push({ 
      x: this.x, 
      y: this.y, 
      size: this.size * 0.8, 
      alpha: 150 
    });
    
    // 更新拖尾
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.85;
      this.trail[i].size *= 0.92;
    }
    
    // 限制拖尾长度
    if (this.trail.length > 6) this.trail.shift();
    
    // 物理更新
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.decay;
    this.vy *= this.decay;
    
    // 边界处理
    if (this.x < 0 || this.x > width) this.vx = -this.vx * 0.6;
    if (this.y < 0 || this.y > height) this.vy = -this.vy * 0.6;
    
    // 约束粒子在画布内
    this.x = constrain(this.x, 0, width);
    this.y = constrain(this.y, 0, height);
  }
  
  display() {
    // 绘制拖尾
    for (let point of this.trail) {
      fill(red(this.color), green(this.color), blue(this.color), point.alpha * 0.5);
      noStroke(); 
      ellipse(point.x, point.y, point.size);
    }
    
    // 绘制粒子本身（随时间淡出）
    let alpha = map(millis() - this.createdTime, 0, this.lifespan, 255, 0);
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    noStroke(); 
    ellipse(this.x, this.y, this.size * 2);
  }
  
  // 检查粒子是否已死亡
  isDead() { 
    return millis() - this.createdTime > this.lifespan; 
  }
}

class FireParticle {
  constructor(x, y, vx, vy, size, color) {
    this.x = x; // X坐标
    this.y = y; // Y坐标
    this.vx = vx; // X轴速度
    this.vy = vy; // Y轴速度
    this.size = size; // 粒子大小
    this.color = color; // 粒子颜色
    this.createdTime = millis(); // 创建时间
    this.lifespan = 1500; // 生命周期（毫秒）
    this.gravity = 0.05; // 重力
    this.decay = random(0.95, 0.98); // 速度衰减系数
  }
  
  update() {
    // 火焰粒子向上飘散
    this.vy += this.gravity - 0.1; // 负值使火焰向上
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.decay;
    this.vy *= this.decay;
    // 尺寸变化模拟火焰闪烁
    this.size *= 0.995;
  }
  
  display() {
    // 计算透明度（随时间淡出）
    let alpha = map(millis() - this.createdTime, 0, this.lifespan, 255, 0);
    
    // 绘制火焰粒子
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    noStroke(); 
    ellipse(this.x, this.y, this.size * 2);
    
    // 绘制火焰外层光晕
    fill(255, 200, 0, alpha * 0.5); 
    ellipse(this.x, this.y, this.size * 1.5);
  }
  
  // 检查粒子是否已死亡
  isDead() { 
    return millis() - this.createdTime > this.lifespan; 
  }
}