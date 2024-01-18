//#region Variable declarations
// Point array
let positions = [];

// Images
let fieldImage;
let chassisImage;

// HTML elements
const container = document.getElementById("container");
const outputText = document.getElementById("output-text");
const helpBox = document.getElementById("help-container");

// Constant (assigned late so sadly have to use let)
let circleSize;

// State machine
const ADD_MODE = 0;
const EDIT_MODE = 1;
const ANIMATION_MODE = 2;
let state = ADD_MODE;

// Visualization toggles
let showLines = true;
let showDots = true;
let showRobot = false;
let showHelpBox = true;

// Main Spline (path)
let spline = new Spline();

// Selected Items
let selectedPoint = null;
let selectedCurve = spline.curves[0];

// Robot variables
let robotPosition;
let robotAngle = 0;
let robotTargetIndex = 0;
let robotScale = 1.5;
let robotSpeed = 0.25;

// Animation state machine
const ROBOT_DRIVING = 0;
const ROBOT_TURNING = 1;
let robotState = ROBOT_DRIVING;

let startingOffset = 0;
//#endregion

function setup() {
  createCanvas(
    min(window.innerHeight, window.innerWidth) / 1.5,
    min(window.innerHeight, window.innerWidth) / 1.5
  );

  fieldImage = loadImage("vex_field.png");
  chassisImage = loadImage("chassis.png");

  container.append(canvas);

  outputText.style.width = `${width * 0.69}px`;
  outputText.style.maxHeight = `${height}px`;

  circleSize = width / 60;
  ellipseMode(RADIUS);

  robotPosition = spline.curves[0].point1.getVector();
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function draw() {
  imageMode(CORNER);
  image(fieldImage, 0, 0, width, height);
  positions = spline.getPoints();
  spline.draw();
  if (showLines) {
    drawLines();
  }
  if (showDots) {
    drawPoints();
  }
  if (showRobot || state == ANIMATION_MODE) {
    drawRobot();
  }
  if (state == ANIMATION_MODE) {
    moveRobot();
  }
  getAutonCode();
  handleCursorStyle();
}

function drawPoint(p) {
  if (p != selectedPoint) {
    noStroke();
  } else {
    stroke(255);
    strokeWeight(p.width);
  }
  fill(0, 70, 254);
  ellipse(mapToImage(p.x), mapToImage(p.y), circleSize);
}

function lineBetweenPoints(a, b) {
  stroke(255, 255, 0);
  strokeWeight(width / 150);
  line(mapToImage(a.x), mapToImage(a.y), mapToImage(b.x), mapToImage(b.y));
}

function drawPoints() {
  if (positions.length <= 0) {
    return;
  }
  for (let i = 0; i < positions.length; i++) {
    drawPoint(positions[i]);
  }
}

function drawLines() {
  if (positions.length <= 1) {
    return;
  }
  for (let i = 1; i < positions.length; i++) {
    setLineDash([1]);
    lineBetweenPoints(positions[i], positions[i - 1]);
  }
}

function drawRobot() {
  push();
  imageMode(CENTER);
  translate(mapToImage(robotPosition.x), mapToImage(robotPosition.y));
  if (robotTargetIndex > 0) rotate(radians(robotAngle));
  image(chassisImage, 0, 0, mapToImage(18 * robotScale), mapToImage(18 * robotScale));
  pop();
}

function deleteCurve() {
  let index = spline.curves.indexOf(selectedCurve);
  if (index > 0 && index < spline.curves.length - 1) {
    spline.curves[index - 1].point2 = spline.curves[index + 1].point1;
    spline.curves[index - 1].controlPoints[3] = spline.curves[index - 1].point2;
  }
  if (index > 0) {
    selectedCurve = null;
    spline.curves.splice(index, 1);
  }
}

function checkPointExists(x, y) {
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (
      pos.x + circleSize >= x &&
      pos.x - circleSize <= x &&
      pos.y + circleSize >= y &&
      pos.y - circleSize <= y
    ) {
      return i;
    }
  }
  return false;
}

function mapToImage(val) {
  return map(val, 0, 144, 0, width);
}

function mapToField(val) {
  return map(val, 0, width, 0, 144);
}

function moveRobot() {
  if (robotState == ROBOT_DRIVING) {
    targetPos = positions[robotTargetIndex].getVector();

    if (p5.Vector.equals(targetPos, robotPosition) && robotTargetIndex + 1 < positions.length) {
      robotTargetIndex++;
      robotState = ROBOT_TURNING;
    }
    robotPosition = robotPosition.add(targetPos.sub(robotPosition).limit(robotSpeed * 5));
  }

  if (robotState == ROBOT_TURNING) {
    pos1 = positions[robotTargetIndex];
    pos2 = positions[robotTargetIndex - 1];
    targetAngle = calculateAngleBetweenPoints(pos1, pos2);
    robotAngle = lerp(robotAngle, targetAngle, robotSpeed);
    if (targetAngle - 1 < robotAngle && robotAngle < targetAngle + 1) {
      robotState = ROBOT_DRIVING;
      robotAngle = targetAngle;
    }
  }
}

function calculateAngleBetweenPoints(a, b) {
  // Calculate the angle
  const deltaX = b.x - a.x;
  const deltaY = b.y - a.y;
  const angleRadians = Math.atan2(deltaY, deltaX);

  // Convert the angle to degrees
  const angleDegrees = floor((angleRadians * 180) / Math.PI);
  return floor(angleDegrees - 90);
}

function handleCursorStyle() {
  switch (state) {
    case ADD_MODE:
      canvas.style.cursor = "cell";
      break;

    case EDIT_MODE:
      canvas.style.cursor = "move";
      break;

    case ANIMATION_MODE:
      canvas.style.cursor = "no-drop";
      break;

    default:
      break;
  }
}

function keyPressed() {
  key = key.toLocaleLowerCase();

  if (state != ANIMATION_MODE) {
    if (key == "d") {
      deleteCurve();
    }
    if (key == "arrowup" && selectedCurve != null) {
      selectedCurve.dt *= 0.5;
    }
    if (key == "arrowdown" && selectedCurve != null) {
      if (selectedCurve.dt * 2 <= 1) selectedCurve.dt *= 2;
    }
  }

  switch (key) {
    case "e":
      state = EDIT_MODE;
      break;
    case "a":
      state = ADD_MODE;
      break;
    case "w":
      state = ANIMATION_MODE;
      robotTargetIndex = 0;
      robotState = ROBOT_DRIVING;
      if (selectedCurve) {
        deSelectCurve();
      }
      break;
    case "x":
      robotScale == 1 ? (robotScale = 1.5) : (robotScale = 1);
      break;
    case "h":
      showHelpBox = !showHelpBox;
      showHelpBox ? (helpBox.style.visibility = "visible") : (helpBox.style.visibility = "hidden");
      break;
    case "c":
      copyAutonCode();
      break;
    case "r":
      reset();
      break;
    case "1":
      showDots = !showDots;
      break;
    case "2":
      showLines = !showLines;
      break;
    case "3":
      showRobot = !showRobot;
      break;
  }
}

function mousePressed() {
  if (showHelpBox) return;
  if (state === ADD_MODE) mousePressedAdd();
  if (state === EDIT_MODE) mousePressedEdit();
  if (state === ANIMATION_MODE) return;

  robotPosition = spline.curves[0].point1.getVector();
}

function mousePressedEdit() {
  if (mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0) {
    // clear current curves
    if (selectedCurve) {
      deSelectCurve();
    }

    // select a new curve
    selectedPoint = spline.findClickedPoint(mouseX, mouseY);
    selectedCurve = spline.findClickedCurve(mouseX, mouseY);

    // show selected curves
    if (selectedCurve) {
      let i = spline.curves.indexOf(selectedCurve);
      spline.curves[i].showHandles = true;
      if (i > 0) spline.curves[i - 1].showHandles = true;
      if (i < spline.curves.length - 2) spline.curves[i + 1].showHandles = true;
    }
  }
}

function mousePressedAdd() {
  if (mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0) {
    if (selectedCurve) {
      deSelectCurve();
    }
    spline.addCurve(mapToField(mouseX), mapToField(mouseY));
    selectedCurve = spline.curves[spline.curves.length - 1];
    selectedCurve.showHandles = true;
  }
}

function mouseDragged() {
  if (selectedPoint == null) return;
  if (state === EDIT_MODE) mouseDraggedEdit();
}

function mouseDraggedEdit() {
  if (mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0) {
    selectedCurve.movePoint(selectedPoint, mapToField(mouseX), mapToField(mouseY));
  }
}

function mouseReleased() {
  selectedPoint = null;
}

function deSelectCurve() {
  let i = spline.curves.indexOf(selectedCurve);
  spline.curves[i].showHandles = false;
  if (i > 0) spline.curves[i - 1].showHandles = false;
  if (i < spline.curves.length - 2) spline.curves[i + 1].showHandles = false;
}
function getAutonCode() {
  let txt = "";
  let previousAngle = 0;
  for (let i = 1; i < positions.length; i++) {
    const pos1 = positions[i].getVector();
    const pos2 = positions[i - 1].getVector();

    const turnAngle = calculateAngleBetweenPoints(pos1, pos2) - startingOffset;
    const driveDistance = floor(p5.Vector.dist(pos1, pos2));

    let turnWaitText;
    let driveWaitText;

    if (abs(turnAngle - previousAngle) > 2) {
      turnWaitText = `chassis.wait_drive();\n`;
    } else {
      turnWaitText = `chassis.wait_until(${turnAngle * 0.9});\n`;
    }

    if (driveDistance > 1) {
      driveWaitText = `chassis.wait_drive();\n`;
    } else {
      driveWaitText = `chassis.wait_until(${driveDistance * 0.9});\n`;
    }

    txt += `\nchassis.set_turn_pid(${turnAngle}, TURN_SPEED);\n`;
    txt += turnWaitText;
    txt += `chassis.set_drive_pid(map_inches_to_pid(${driveDistance}), DRIVE_SPEED);\n`;
    txt += driveWaitText;

    previousAngle = turnAngle;
  }

  if (txt == "") {
    txt = "Click to add some points :D";
  }

  outputText.innerText = txt;
}

function copyAutonCode() {
  navigator.clipboard.writeText(outputText.innerText);
}

function reset() {
  spline = new Spline();
  robotTargetIndex = 0;
  selectedCurve = spline.curves[0];
  robotPosition = spline.curves[0].point1.getVector();
}
