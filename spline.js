class Spline {
  constructor() {
    this.curves = [
      new BezierCurve(
        new Point(104, 128),
        new Point(141, 128),
        new Point(104, 69),
        new Point(67, 69),
        1
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
    let controlPoint1 = new Point((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2);
    let controlPoint2 = new Point((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2);
    this.curves.push(
      new BezierCurve(
        startPoint,
        controlPoint1,
        endPoint,
        controlPoint2,
        this.curves[this.curves.length - 1].dt
      )
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

  findClickedCurve(x, y) {
    for (const curve of this.curves) {
      let foundPoint = curve.findClickedPoint(x, y);
      if (foundPoint !== null) {
        return curve;
      }
    }
    return null;
  }

  getPoints() {
    let points = [];
    for (const curve of this.curves) {
      points = points.concat(curve.getPoints());
    }

    // removing duplicates (finally)
    for (let i = points.length - 1; i > 0; i--) {
      if (points[i].equals(points[i - 1])) {
        points.splice(i, 1);
      }
    }

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
      x <= mapToImage(this.x) + this.w / 2 &&
      x >= mapToImage(this.x) - this.w / 2 &&
      y <= mapToImage(this.y) + this.w / 2 &&
      y >= mapToImage(this.y) - this.w / 2
    );
  }

  copy() {
    return new Point(this.x, this.y);
  }

  equals(other) {
    return this.x == other.x && this.y == other.y;
  }

  getVector() {
    return createVector(this.x, this.y);
  }
}

class BezierCurve {
  constructor(point1, control1, point2, control2, deltaT) {
    this.dt = deltaT;
    this.point1 = point1;
    this.point2 = point2;
    this.control1 = control1;
    this.control2 = control2;
    this.controlPoints = [point1, control1, control2, point2];
  }

  draw() {
    this.drawPoints();
    if (this == selectedCurve && showLines) {
      this.drawCurve();
    }
    if (this.dt != 1) {
      this.drawHandles();
    }
  }

  binomialCoefficient(n, k) {
    if (k === 0 || k === n) {
      return 1;
    } else {
      return this.binomialCoefficient(n - 1, k - 1) + this.binomialCoefficient(n - 1, k);
    }
  }

  bezierCurve(t, controlPoints) {
    const n = controlPoints.length - 1;
    let result = new Point(0, 0);

    for (let i = 0; i <= n; i++) {
      const coefficient = this.binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
      result.x += coefficient * controlPoints[i].x;
      result.y += coefficient * controlPoints[i].y;
    }
    return result;
  }

  drawPoints() {
    if (this.dt == 1 || !showDots) {
      return;
    }
    noStroke();
    for (let i = 0; i < this.controlPoints.length; i++) {
      const pt = this.controlPoints[i];
      if (pt == this.control1 || pt == this.control2) {
        fill(255);
      } else {
        fill(128, 53, 90);
      }
      pt.draw();
    }
  }

  drawCurve() {
    noFill();
    strokeWeight(6);
    setLineDash([1]);
    beginShape();
    stroke(0);
    for (let t = 0; t <= 1; t += this.dt) {
      const point = this.bezierCurve(t, this.controlPoints);
      vertex(mapToImage(point.x), mapToImage(point.y));
    }
    endShape();
  }

  drawHandles() {
    if (!showDots) return;
    setLineDash([10, 10]);
    stroke(255, 0, 100);
    strokeWeight(2);
    line(
      mapToImage(this.control1.x),
      mapToImage(this.control1.y),
      mapToImage(this.point1.x),
      mapToImage(this.point1.y)
    );
    line(
      mapToImage(this.control2.x),
      mapToImage(this.control2.y),
      mapToImage(this.point2.x),
      mapToImage(this.point2.y)
    );
  }

  findClickedPoint(x, y) {
    for (const pt of this.controlPoints) {
      if (pt.isClicked(x, y) === true) {
        return pt;
      }
    }
    return null;
  }
  
  getPoints() {
    const points = [];
    for (let t = 0; t <= 1; t += this.dt) {
      points.push(this.bezierCurve(t, this.controlPoints));
    }
    return points;
  }
}
