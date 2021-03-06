import { PaperSize, Orientation } from "penplot";
import { polylinesToSVG } from "penplot/util/svg";
import { clipPolylinesToBox } from "penplot/util/geom";

import { optimizeOrder, mergeLines } from "./utils";

import rawLines from "../generated/lines-scandy.json";

export const orientation = Orientation.LANDSCAPE;
export const dimensions = [11.4, 11.4];

const drawingSize = 7;
const margin = (dimensions[0] - drawingSize) / 2;

const RAW_DIM = [800, 800];

const scaleLines = (lines) => {
  const scale = (dimensions[0] - margin * 2) / RAW_DIM[0];
  return lines.map(([[x1, y1], [x2, y2]]) => {
    return [
      [margin + x1 * scale, margin + y1 * scale],
      [margin + x2 * scale, margin + y2 * scale],
    ];
  });
};

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;

  // Clip all the lines to a margin

  const box = [margin, margin, width - margin, height - margin];
  const scaledLines = scaleLines(rawLines);
  console.log(scaledLines);
  const lines = optimizeOrder(mergeLines(clipPolylinesToBox(scaledLines, box)));

  return {
    draw,
    print,
    background: "white",
    animate: false,
    clear: true,
  };

  function draw() {
    lines.forEach((points) => {
      context.beginPath();
      points.forEach((p) => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print() {
    return polylinesToSVG(lines, {
      dimensions,
    });
  }
}
