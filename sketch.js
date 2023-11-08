let positions = [];

let fieldImage;
let chassisImage;

const container = document.getElementById("container");
const outputText = document.getElementById("output-text");

let circleSize;

const ADD_MODE = 0;
const EDIT_MODE = 1;
const ANIMATION_MODE = 2;
let state = ADD_MODE;

let showLines = true;
let showDots = true;
let showRobot = false;

let selectedPoint = null;

let robotPosition;
let robotAngle = 0;
let robotTargetIndex = 0;

const ROBOT_DRIVING = 0;
const ROBOT_TURNING = 1;
let robotState = ROBOT_DRIVING;

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

    if(showLines){
        drawLines();
    }
    if(showDots){
        drawPoints();
    }
    if(showRobot || state == ANIMATION_MODE){
        drawRobot();
    }
    if(state == ANIMATION_MODE){
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

function drawRobot(){
    push();
    imageMode(CENTER);
    translate(mapToImage(robotPosition.x), mapToImage(robotPosition.y));
    if(robotTargetIndex > 0)
    rotate(radians(robotAngle));
    image(chassisImage, 0, 0, mapToImage(18 * 2.5), mapToImage(18 * 2.5));
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
    positions.splice(positions.indexOf(selectedPoint), 1);
    selectedPoint = null;
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
    return map(val, 0, 288, 0, width);
}

function mapToField(val) {
    return map(val, 0, width, 0, 288);
}

function moveRobot(){
    if(robotState == ROBOT_DRIVING){
        targetPos = positions[robotTargetIndex].copy();
        if(p5.Vector.equals(targetPos, robotPosition) && robotTargetIndex + 1 < positions.length){
            robotTargetIndex++;
            robotState = ROBOT_TURNING;
        }
        robotPosition = robotPosition.add(targetPos.sub(robotPosition).limit(1.25));
    }
    if(robotState == ROBOT_TURNING){
        pos1 = positions[robotTargetIndex];
        pos2 = positions[robotTargetIndex - 1];
        targetAngle = calculateAngleBetweenPoints(pos1.x, pos1.y, pos2.x, pos2.y) 
        robotAngle = lerp(robotAngle, targetAngle, .1);
        if (targetAngle - 1 < robotAngle && robotAngle < targetAngle + 1){
            robotState = ROBOT_DRIVING;
            robotAngle = targetAngle;
        }
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
    if (key == "e") {
        state = EDIT_MODE;
    }
    if (key == "a") {
        state = ADD_MODE;
    }
    if (key == " ") {
        state = ANIMATION_MODE;
        robotTargetIndex = 0;
    }
    if (key == "delete" && state != ANIMATION_MODE) {
        deletePoint();
    }

    if(key == "1"){
        showDots = !showDots;
    }
    if(key == "2"){
        showLines = !showLines;
    }
    if(key == "3"){
        showRobot = !showRobot;
    }

    if (key == "c") {
        copyAutonCode();
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
        const pos = positions[i];
        // yes this is ugly and no i wont change it :3
        txt += `chassis.set_turn_pid(${calculateAngleBetweenPoints(
            pos.x,
            pos.y,
            positions[i - 1].x,
            positions[i - 1].y
        )}, TURN_SPEED);\nchassis.wait_drive();\nchassis.set_drive_pid(${floor(
            p5.Vector.dist(pos, positions[i - 1])
        )}, DRIVE_SPEED);\nchassis.wait_drive();\n\n`;
    }
    if(txt == ""){
        txt = "Click to add some points :D"
    }
    outputText.innerText = txt;
}

function copyAutonCode() {
    navigator.clipboard.writeText(outputText.innerText);
}
