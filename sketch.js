let fieldImage;
let positions = [];
const container = document.getElementById("container");
const outputText = document.getElementById("output-text");
function setup() {
    createCanvas(window.innerHeight/1.5, window.innerHeight/1.5);
    fieldImage = loadImage("vex_field.png");
    container.append(canvas);
    outputText.style.width = `${width*.69}px`
    outputText.style.maxHeight = `${height}px`
}

function draw() {
    image(fieldImage, 0, 0, width, height);
    if (positions.length <= 0) {
        return;
    }

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        fill(100, 0, 255);
        noStroke();
        ellipse(mapToImage(pos.x), mapToImage(pos.y), width/30);
        if (i > 0) {
            stroke(255, 0, 100);
            strokeWeight(width/150);
            line(mapToImage(pos.x), mapToImage(pos.y), mapToImage(positions[i - 1].x), mapToImage(positions[i - 1].y));
        }
    }
}

function mapToImage(val){
    return map(val, 0, 288, 0, width);
}
function mapToField(val){
    return map(val, 0, width, 0, 288);
}

function mousePressed() {
    if(mouseX<=width && mouseX >= 0&& mouseY <= height && mouseY >= 0){
        positions.push(createVector(mapToField(mouseX), mapToField(mouseY)));
        getAutonCode();
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
    console.log(txt);
    outputText.innerText = txt;
}