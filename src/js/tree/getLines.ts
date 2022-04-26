import { Line, Point, Rect } from "./types";

const p = (x: number, y: number): Point => {
  return [x, y];
};

const l = (startPos: Point, endPos: Point): Line => {
  return [startPos, endPos];
};

const r = (p1: Point, w: number, h: number): Rect => {
  return [p1, w, h];
};

const radians = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

const dist = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

const pointInRect = (point: Point, rect: Rect) => {
  const [px, py] = point;
  const [[rx, ry], rw, rh] = rect;
  return px > rx && px < rx + rw && py > ry && py < ry + rh;
};

const getLines = (frameSize: Point, treeStartPos: Point): Line[] => {
  const [frameWidth, frameHeight] = frameSize;
  const [treeStartX, treeStartY] = treeStartPos;
  const frameRect = r(p(0, 0), frameWidth, frameHeight);

  const minSegmentSize = frameHeight * 0.1;

  const branch = (
    startPos: Point,
    distance: number,
    angle: number,
    maxSegments: number
  ): Line[] => {
    let segments: Line[] = [];

    const [startX, startY] = startPos;

    let curPos = p(startX, startY);

    const endPos = p(
      startX + Math.cos(angle) * distance,
      startY + Math.sin(angle) * distance
    );

    const [endX, endY] = endPos;

    if (!pointInRect(endPos, frameRect)) {
      return null;
    }

    while (
      dist(curPos, endPos) > minSegmentSize &&
      segments.length < maxSegments
    ) {
      const [curX, curY] = curPos;

      const deltaX = (endX - curX) * 0.1;
      const deltaY = (endY - curY) * 0.1;

      const offset = Math.abs(deltaY) * 0.3;

      const offsetX = -offset + Math.random() * offset * 2;
      const offsetY = -offset + Math.random() * offset * 2;

      const newPos = p(curX + deltaX + offsetX, curY + deltaY + offsetY);

      segments = [...segments, l(curPos, newPos)];

      curPos = newPos;
    }

    return segments.reduce((acc, segment) => {
      if (Math.random() > 0.05) {
        const newMax = maxSegments - 3;
        if (newMax <= 0) {
          return acc;
        }
        const newSegments = branch(
          segment[1],
          100,
          radians(Math.random() * 360),
          newMax
        );
        if (!newSegments) {
          return acc;
        }
        return [...acc, ...newSegments];
      }
      return acc;
    }, segments);
  };

  // return [[treeStartPos, p(frameWidth / 2, 10)]];

  return branch(treeStartPos, frameHeight * 0.9, radians(270), 10);
};

export default getLines;
