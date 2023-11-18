const deltaT = 0.1;

class Spline {
    constructor() {
        this.curves = [
            new BezierCurve(
                new Point(208, 256),
                new Point(230, 255),
                new Point(211, 134),
                new Point(184, 134)
            ),
        ];
    }
    draw() {
        for (const curve of this.curves) {
            curve.draw();
        }
    }

    addCurve(x, y) {
        let startPoint = this.curves[this.curves.length - 1].point2;
        let endPoint = new Point(x, y);
        let controlPoint1 = new Point(
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2
        );
        let controlPoint2 = new Point(
            (startPoint.x + endPoint.x) / 2,
            (startPoint.y + endPoint.y) / 2
        );
        this.curves.push(
            new BezierCurve(startPoint, controlPoint1, endPoint, controlPoint2)
        );
    }

    findClickedPoint(x, y) {
        for (const curve of this.curves) {
            let foundPoint = curve.findClickedPoint(x, y);
            if (foundPoint !== null) {
                return foundPoint;
            }
        }
        return null;
    }

    getPoints() {
        let points = [];
        for (const curve of this.curves) {
            points = points.concat(curve.getPoints());
        }
        // console.log(points);
        return points;
    }
}

class Point {
    constructor(x, y) {
        this.w = 30;
        this.x = x;
        this.y = y;
    }
    draw() {
        textSize(this.w);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text("X", mapToImage(this.x), mapToImage(this.y));
    }
    isClicked(x, y) {
        
        return (
            x <= mapToImage(this.x) + this.w &&
            x >= mapToImage(this.x) - this.w &&
            y <= mapToImage(this.y) + this.w &&
            y >= mapToImage(this.y) - this.w
        );
    }
}

class BezierCurve {
    constructor(point1, control1, point2, control2) {
        this.point1 = point1;
        this.point2 = point2;
        this.control1 = control1;
        this.control2 = control2;
        this.controlPoints = [point1, control1, control2, point2];
        this.curvePoints = [];
    }

    draw() {
        this.drawPoints();
        // this.drawCurve();
        this.drawHandles();
    }

    binomialCoefficient(n, k) {
        if (k === 0 || k === n) {
            return 1;
        } else {
            return (
                this.binomialCoefficient(n - 1, k - 1) +
                this.binomialCoefficient(n - 1, k)
            );
        }
    }

    bezierCurve(t, controlPoints) {
        const n = controlPoints.length - 1;
        let result = new Point(0, 0);

        for (let i = 0; i <= n; i++) {
            const coefficient =
                this.binomialCoefficient(n, i) *
                Math.pow(1 - t, n - i) *
                Math.pow(t, i);
            result.x += coefficient * controlPoints[i].x;
            result.y += coefficient * controlPoints[i].y;
        }
        return result;
    }

    drawPoints() {
        noStroke();
        for (let i = 0; i < this.controlPoints.length; i++) {
            const pt = this.controlPoints[i];
            if (pt == this.control1 || pt == this.control2) {
                fill(255);
            } else {
                fill(255, 105, 180);
            }
            pt.draw();
        }
    }

    drawCurve() {
        noFill();
        strokeWeight(5);
        setLineDash([1]);
        beginShape();
        for (let t = 0; t <= 1; t += deltaT) {
            const point = this.bezierCurve(t, this.controlPoints);
            stroke(100, 0, 255);
            vertex(mapToImage(point.x), mapToImage(point.y));
        }
        endShape();
    }

    drawHandles() {
        setLineDash([10, 10]);
        stroke(255, 0, 100);
        strokeWeight(2);
        line(mapToImage(this.control1.x), mapToImage(this.control1.y), mapToImage(this.point1.x), mapToImage(this.point1.y));
        line(mapToImage(this.control2.x), mapToImage(this.control2.y), mapToImage(this.point2.x), mapToImage(this.point2.y));
    }

    findClickedPoint(x, y) {
        for (const pt of this.controlPoints) {
            if (pt.isClicked(x, y) === true) {
                return pt;
            }
        }
        return null;
    }
    getPoints(){
        const points = [];
        for (let t = 0; t <= 1; t += deltaT) {
            points.push(this.bezierCurve(t, this.controlPoints));
        }
        return points;
    }
}
