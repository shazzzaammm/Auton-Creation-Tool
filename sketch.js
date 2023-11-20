// Dot array
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

// Curerntly selected point
let selectedPoint = null;

// Robot variables
let robotPosition;
let robotAngle = 0;
let robotTargetIndex = 0;
let robotScale = 1.5;

// Animation state machine
const ROBOT_DRIVING = 0;
const ROBOT_TURNING = 1;
let robotState = ROBOT_DRIVING;

let startingOffset = 0;
function setup() {
    createCanvas(min(window.innerHeight, window.innerWidth) / 1.5, min(window.innerHeight, window.innerWidth) / 1.5);
    fieldImage = loadImage("vex_field.png");
    chassisImage = loadImage("chassis.png");
    container.append(canvas);
    outputText.style.width = `${width * 0.69}px`;
    outputText.style.maxHeight = `${height}px`;
    circleSize = width / 60;
    ellipseMode(RADIUS);
}

function draw() {
    imageMode(CORNER);
    image(fieldImage, 0, 0, width, height);

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
}

function drawPoint(p) {
    if (p != selectedPoint) {
        noStroke();
    } else {
        stroke(255);
        strokeWeight(width / 150);
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
        lineBetweenPoints(positions[i], positions[i - 1]);
    }
}

function drawRobot() {
    push();
    imageMode(CENTER);
    translate(mapToImage(robotPosition.x), mapToImage(robotPosition.y));
    if (robotTargetIndex > 0)
        rotate(radians(robotAngle));
    image(chassisImage, 0, 0, mapToImage(18 * robotScale), mapToImage(18 * robotScale));
    pop()
}

function addPoint(x, y) {
    const point = createVector(mapToField(x), mapToField(y));
    const index = positions.indexOf(selectedPoint);

    positions.splice(index + 1, 0, point);

    selectedPoint = point;
    robotPosition = positions[0].copy();
}

function deletePoint() {
    if (selectedPoint === null || state === ANIMATION_MODE) {
        return;
    }

    index = positions.indexOf(selectedPoint);
    positions.splice(index, 1);

    if (index > 0) {
        selectedPoint = positions[index - 1];
    } else {
        selectedPoint = null;
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
        driveRobot();
    }
    if (robotState == ROBOT_TURNING) {
        turnRobot();
    }
}

function driveRobot() {
    targetPos = positions[robotTargetIndex].copy();
    if (p5.Vector.equals(targetPos, robotPosition) && robotTargetIndex + 1 < positions.length) {
        robotTargetIndex++;
        robotState = ROBOT_TURNING;
    }
    robotPosition = robotPosition.add(targetPos.sub(robotPosition).limit(1.25));
}

function turnRobot() {
    pos1 = positions[robotTargetIndex];
    pos2 = positions[robotTargetIndex - 1];
    targetAngle = calculateAngleBetweenPoints(pos1.x, pos1.y, pos2.x, pos2.y)
    robotAngle = lerp(robotAngle, targetAngle, .1);
    if (targetAngle - 1 < robotAngle && robotAngle < targetAngle + 1) {
        robotState = ROBOT_DRIVING;
        robotAngle = targetAngle;
    }
}

function calculateAngleBetweenPoints(x1, y1, x2, y2) {
    // Calculate the angle in radians
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angleRadians = Math.atan2(deltaY, deltaX);

    // Convert the angle from radians to degrees
    const angleDegrees = floor((angleRadians * 180) / Math.PI);
    return floor(angleDegrees - 90);
}

function keyPressed() {
    key = key.toLocaleLowerCase();
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
            break;

        case "d":
            deletePoint();
            break;

        case "x":
            robotScale == 1 ? robotScale = 1.5 : robotScale = 1;
            break;

        case "h":
            showHelpBox = !showHelpBox;
            showHelpBox ? helpBox.style.visibility = "visible" : helpBox.style.visibility = "hidden";
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

        case "c":
            copyAutonCode();
            break;
    }
}

function mousePressedAddMode() {
    if (mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0) {
        addPoint(mouseX, mouseY);
    }
}

function mousePressedEditMode() {
    index = checkPointExists(mapToField(mouseX), mapToField(mouseY));
    if (index !== false) {
        selectedPoint = positions[index];
    }
}

function mousePressed() {
    if (state == ADD_MODE) {
        mousePressedAddMode();
    } else if (state == EDIT_MODE) {
        mousePressedEditMode();
    }
}

function mouseDraggedEditMode() {
    selectedPoint.x = mapToField(mouseX);
    selectedPoint.y = mapToField(mouseY);
}

function mouseDragged() {
    if (state == EDIT_MODE) {
        mouseDraggedEditMode();
    }
}

function getAutonCode() {
    txt = "";
    for (let i = 1; i < positions.length; i++) {
        const pos1 = positions[i];
        const pos2 = positions[i - 1];
        // yes this is ugly and no i wont change it :3
        txt += `chassis.set_turn_pid(${calculateAngleBetweenPoints(pos1.x, pos1.y, pos2.x, pos2.y)-startingOffset}, TURN_SPEED);
        chassis.wait_drive();
        chassis.set_drive_pid(${floor(p5.Vector.dist(pos1, pos2))}, DRIVE_SPEED);
        chassis.wait_drive();
        
        `;
    }
    if (txt == "") {
        txt = "Click to add some points :D"
    }
    outputText.innerText = txt;
}

function copyAutonCode() {
    navigator.clipboard.writeText(outputText.innerText);
}
