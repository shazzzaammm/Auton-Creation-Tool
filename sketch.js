let fieldImage;
let positions = [];
const container = document.getElementById("container");
const outputText = document.getElementById("output-text");
let circleSize;

const ADD_MODE = 0;
const EDIT_MODE = 1;
let state = ADD_MODE;

let selectedPoint = null;

function setup() {
    createCanvas(window.innerHeight/1.5, window.innerHeight/1.5);
    fieldImage = loadImage("vex_field.png");
    container.append(canvas);
    outputText.style.width = `${width*.69}px`
    outputText.style.maxHeight = `${height}px`
    circleSize = width / 60;
    ellipseMode(RADIUS);
}

function draw() {
    image(fieldImage, 0, 0, width, height);
    drawPoints();
    getAutonCode();
}

function drawPoints(){
    if (positions.length <= 0) {
        return;
    }
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (pos!=selectedPoint){
            fill(100, 0, 255);
        }
        else{
            fill(255, 255, 255);
        }
        noStroke();
        ellipse(mapToImage(pos.x), mapToImage(pos.y), circleSize);
        if (i > 0) {
            stroke(255, 0, 100);
            strokeWeight(width/150);
            line(mapToImage(pos.x), mapToImage(pos.y), mapToImage(positions[i - 1].x), mapToImage(positions[i - 1].y));
        }
    }
}

function addPoint(x, y){
    positions.push(createVector(mapToField(x), mapToField(y)));
    selectedPoint = positions[positions.length-1];
}

function checkPointExists(x, y){
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if(pos.x == x && pos.y == y){
            return i;
        }
        if (pos.x + circleSize >= x && pos.x - circleSize <= x && pos.y + circleSize >= y && pos.y - circleSize <= y){
            return i;
        }
    }
    return false;
}

function mapToImage(val){
    return map(val, 0, 288, 0, width);
}

function mapToField(val){
    return map(val, 0, width, 0, 288);
}

function mousePressedAddMode(){
    if(mouseX<=width && mouseX >= 0&& mouseY <= height && mouseY >= 0){
        addPoint(mouseX,mouseY);
    }
}

function mousePressedEditMode(){
    index = checkPointExists(mapToField(mouseX), mapToField(mouseY));
    if(index !== false){
        selectedPoint = positions[index];
    }
}

function mousePressed() {
    if(state==ADD_MODE){
        mousePressedAddMode();
    } 
    else if (state==EDIT_MODE){
        mousePressedEditMode();
    } 
}

function mouseDraggedEditMode(){
    selectedPoint.x = mapToField(mouseX);
    selectedPoint.y = mapToField(mouseY);
}

function mouseDragged(){
    if(state==EDIT_MODE){
        mouseDraggedEditMode();
    }
}

function keyPressed(){
    if(key == "e"){
        state = EDIT_MODE;
    }
    if (key=="a"){
        state = ADD_MODE;
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

function getAutonCode(){
    txt = "";
    for (let i = 1; i < positions.length; i++) {
        const pos = positions[i];
        // yes this is ugly and no i wont change it :3
        txt += (`chassis.set_turn_pid(${calculateAngleBetweenPoints(pos.x, pos.y, positions[i-1].x, positions[i-1].y)}, TURN_SPEED);\nchassis.wait_drive();\nchassis.set_drive_pid(${floor(p5.Vector.dist(pos, positions[i-1]))}, DRIVE_SPEED);\nchassis.wait_drive();\n\n`);
    }
    outputText.innerText = txt;
}