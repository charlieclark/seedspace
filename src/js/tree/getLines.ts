import { Line, Point, Rect } from "./types";
import { runInContext, times } from "lodash";
import * as eases from "eases";
import seedrandom = require("seedrandom");
import pSeries from "p-series";

const delay = (d: number) => new Promise((resolve) => setTimeout(resolve, d));

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

const getLines = async (frameSize: Point): Promise<Line[][]> => {
  seedrandom("charlie", { global: true });

  const { random, shuffle } = runInContext();

  const maxSegments = 10000;
  const maxCycles = 6;
  const initialStartWidth = random(30, 60);
  const endWidth = 1;

  const [frameWidth, frameHeight] = frameSize;
  const treeStartPos = p(frameWidth / 2, frameHeight);
  const [treeStartX, treeStartY] = treeStartPos;
  const frameRect = r(p(0, 0), frameWidth, frameHeight);
  const minSegmentSize = frameHeight * 0.01;
  let segmentCount = 0;

  const leaves: Point[] = [];

  const branch = async (
    startPos: Point,
    distance: number,
    angle: number,
    cycle: number,
    startWidth: number
  ): Promise<Line[]> => {
    const isFirstCycle = cycle === 1;

    let segments: Line[] = [];

    const [startX, startY] = startPos;

    let curPos = p(startX, startY);

    const endPos = p(
      startX + Math.cos(radians(angle)) * distance,
      startY + Math.sin(radians(angle)) * distance
    );

    const [endX, endY] = endPos;

    if (!pointInRect(endPos, frameRect)) {
      return null;
    }

    let hasReached = false;

    while (segmentCount < maxSegments && !hasReached) {
      const curDist = dist(curPos, endPos);

      if (curDist < minSegmentSize) {
        times(1).map(() => {
          if (random() > 0.5) {
            leaves.push(
              p(curPos[0] + random(-10, 10), curPos[1] + random(-10, 10))
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

    // await delay(0);

    let splitCount = 0;

    let childSegments: Line[] = [];

    await pSeries(
      shuffle(segments.map((segment, index) => ({ segment, index }))).map(
        ({ segment, index }) =>
          async () => {
            {
              const numSplits = isFirstCycle ? 2 : 1;
              const branchChance = isFirstCycle ? 0.5 : 0.3;

              await pSeries(
                times(numSplits).map(() => {
                  return async () => {
                    if (random() > branchChance && cycle < maxCycles) {
                      splitCount++;

                      const newAngle = isFirstCycle
                        ? shuffle([random(200, 240), random(300, 340)])[0]
                        : angle + random(-90, 90);

                      const baseDistance = isFirstCycle
                        ? random(0.5, 0.6)
                        : random(0.3, 0.7);

                      const ease = isFirstCycle ? eases.quadIn : eases.linear;

                      const ratio = (segments.length - index) / segments.length;

                      const newSegments = await branch(
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
                  };
                })
              );
            }
          }
      )
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

      const numSteps = Math.round((distance / frameWidth) * 170);

      const circles = times(numSteps).map((index) => {
        const ratio = index / numSteps;
        const radius = width1 + (width2 - width1) * ratio;
        const newX = startX + (endX - startX) * ratio;
        const newY = startY + (endY - startY) * ratio;
        return circleToLines(p(newX, newY), radius, 10);
      });

      convertedSegments = [...convertedSegments, ...circles.flat(1)];
    });

    // if (convertedSegments.length) {
    //   const concavePoints: Point[] = concaveman(
    //     convertedSegments.flat(1),
    //     2.2
    //   ).map(([x, y]) => p(x, y));

    //   convertedSegments = concavePoints.map((p1, index) => {
    //     const p2 = concavePoints[index + 1] || concavePoints[0];
    //     return l(p1, p2);
    //   });
    //   console.log(convertedSegments);
    //   const p1 = new Polygon(convertedSegments);
    // }

    return [...convertedSegments, ...childSegments];
  };

  // return [[treeStartPos, p(frameWidth / 2, 10)]];

  const allBranches = await branch(
    treeStartPos,
    frameHeight * random(0.8, 0.9),
    random(260, 280),
    1,
    initialStartWidth
  );

  const leafLines = shuffle(leaves).reduce((acc, leafPos) => {
    const circleLines = circleToLines(leafPos, random(1, 3, true), 5);
    return [...acc, ...circleLines];
  }, []);

  return [allBranches, leafLines];
};

export default getLines;
