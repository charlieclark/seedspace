import { Line, Point, Rect } from "./types";
import { runInContext, times } from "lodash";
import * as eases from "eases";
import seedrandom from "seedrandom";

export const p = (x: number, y: number): Point => {
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

const circleToLines = (mid: Point, radius: number, sections: number) => {
  const points: Point[] = [];
  const lines: Line[] = [];
  const [midX, midY] = mid;

  times(sections).forEach((index) => {
    const angle = radians(360 / sections) * index;
    const nextPoint = p(
      midX + Math.cos(angle) * radius,
      midY + Math.sin(angle) * radius
    );
    if (points.length > 0) {
      lines.push(l(points[points.length - 1], nextPoint));
    }
    points.push(nextPoint);
  });
  lines.push(l(points[points.length - 1], points[0]));

  return lines;
};

const getLines = (frameSize: Point, seed: string) => {
  seedrandom(seed, { global: true });

  const [frameWidth, frameHeight] = frameSize;
  const treeStartPos = p(frameWidth / 2, frameHeight);
  const [treeStartX, treeStartY] = treeStartPos;
  const minSegmentSize = frameHeight * 0.01;
  const maxSegments = 10000;
  const maxCycles = 6;

  const { random, shuffle } = runInContext();

  const s = (v: number) => Math.ceil((frameWidth * v) / 800);

  const frameBoundariesOffset = s(20);
  const frameBoundariesRect = r(
    p(frameBoundariesOffset, frameBoundariesOffset),
    frameWidth - frameBoundariesOffset * 2,
    frameHeight - frameBoundariesOffset * 2
  );

  const initialStartWidth = random(s(30), s(70));
  const endWidth = 1;

  let segmentCount = 0;

  const leaves: Point[] = [];

  const branch = (
    startPos: Point,
    distance: number,
    angle: number,
    cycle: number,
    startWidth: number
  ): Line[] => {
    const isFirstCycle = cycle === 1;

    let segments: Line[] = [];

    const [startX, startY] = startPos;

    let curPos = p(startX, startY);

    const endPos = p(
      startX + Math.cos(radians(angle)) * distance,
      startY + Math.sin(radians(angle)) * distance
    );

    const [endX, endY] = endPos;

    if (!pointInRect(endPos, frameBoundariesRect)) {
      return null;
    }

    let hasReached = false;

    while (segmentCount < maxSegments && !hasReached) {
      const curDist = dist(curPos, endPos);

      if (curDist < minSegmentSize) {
        times(1).map(() => {
          if (random() > 0.5) {
            leaves.push(
              p(
                curPos[0] + random(-s(10), s(10)),
                curPos[1] + random(-s(10), s(10))
              )
            );
          }
        });
        hasReached = true;
        continue;
      }

      const [curX, curY] = curPos;

      const deltaX =
        (endX - curX) * (isFirstCycle ? random(0.1, 0.3) : random(0.1, 0.5));
      const deltaY =
        (endY - curY) * (isFirstCycle ? random(0.1, 0.3) : random(0.1, 0.5));

      const offset = Math.abs(deltaY) * (isFirstCycle ? 0.5 : 0.3);

      const offsetX = -offset + random() * offset * 2;
      const offsetY = -offset + random() * offset * 2;

      const newPos = p(curX + deltaX + offsetX, curY + deltaY + offsetY);

      segments = [...segments, l(curPos, newPos)];
      segmentCount++;

      curPos = newPos;
    }

    const cumuSegmentLengths: number[] = segments.reduce(
      (acc, segment) => {
        const prevDist = acc[acc.length - 1];
        return [...acc, prevDist + dist(segment[0], segment[1])];
      },
      [0]
    );

    const weightDiff = startWidth - endWidth;
    const getWidthForSegmentIndex = (index: number) => {
      const widthRatio =
        cumuSegmentLengths[index] /
        cumuSegmentLengths[cumuSegmentLengths.length - 1];
      const width1 = startWidth - widthRatio * weightDiff;
      return width1;
    };

    let childSegments: Line[] = [];

    shuffle(segments.map((segment, index) => ({ segment, index }))).map(
      ({ segment, index }) => {
        const numSplits = isFirstCycle ? 2 : 1;
        const branchChance = isFirstCycle ? 0.5 : 0.3;

        times(numSplits).map(() => {
          if (random() > branchChance && cycle < maxCycles) {
            const newAngle = isFirstCycle
              ? shuffle([random(200, 240), random(300, 340)])[0]
              : angle + random(-90, 90);

            const baseDistance = isFirstCycle
              ? random(0.5, 0.6)
              : random(0.3, 0.7);

            const ease = isFirstCycle ? eases.quadIn : eases.linear;

            const ratio = (segments.length - index) / segments.length;

            const newSegments = branch(
              segment[1],
              distance * baseDistance * ease(ratio),
              newAngle,
              cycle + 1,
              getWidthForSegmentIndex(index) * 0.5
            );
            if (newSegments) {
              childSegments = [...childSegments, ...newSegments];
            }
          }
        });
      }
    );

    let convertedSegments: Line[] = [];

    if (isFirstCycle) {
      segments = [
        l(p(treeStartX, treeStartY + initialStartWidth * 2), treeStartPos),
        ...segments,
      ];
    }

    segments.forEach((segment, index) => {
      const [p1, p2] = segment;
      const [startX, startY] = p1;
      const [endX, endY] = p2;

      const distance = dist(segment[0], segment[1]);

      const width1 = getWidthForSegmentIndex(index);
      const width2 = getWidthForSegmentIndex(index + 1);

      if (!width2) {
        return;
      }

      const numSteps = Math.round((distance / frameWidth) * s(170));

      const circles = times(numSteps).map((index) => {
        const ratio = index / numSteps;
        const radius = width1 + (width2 - width1) * ratio;
        const newX = startX + (endX - startX) * ratio;
        const newY = startY + (endY - startY) * ratio;
        const sections = Math.min(Math.max(5, Math.ceil(radius * 0.5)), 10);
        return circleToLines(p(newX, newY), radius, sections);
      });

      convertedSegments = [...convertedSegments, ...circles.flat()];
    });

    return [...convertedSegments, ...childSegments];
  };

  const allBranches = branch(
    treeStartPos,
    frameHeight * random(0.85, 0.92),
    random(260, 280),
    1,
    initialStartWidth
  );

  const outlineWidth = s(2);
  const outlineLines = times(outlineWidth)
    .map((o) => {
      const [w, h] = frameSize;

      return [
        l(p(outlineWidth, o), p(w, o)),
        l(p(w - o, outlineWidth), p(w - o, h)),
        l(p(w - outlineWidth, h - o), p(0, h - o)),
        l(p(o, h - outlineWidth), p(o, 0)),
      ];
    })
    .flat();

  const leafLines = shuffle(leaves).reduce((acc, leafPos) => {
    const radius = random(s(1), s(3), true);
    const sections = radius === 1 ? 1 : 5;
    const circleLines = circleToLines(leafPos, radius, sections);
    return [...acc, ...circleLines];
  }, []);

  return { outlineLines, allBranches, leafLines };
};

export default getLines;
