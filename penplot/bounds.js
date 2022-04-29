import { PaperSize, Orientation } from "penplot";
import { polylinesToSVG } from "penplot/util/svg";
import { clipPolylinesToBox } from "penplot/util/geom";

import rawLines from "../generated/lines.json";

export const orientation = Orientation.LANDSCAPE;
export const dimensions = [11.4, 11.4];

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;

  const lines = [
    [
      [0, 0],
      [width, 0],
    ],
    [
      [width, 0],
      [width, height],
    ],
    [
      [width, height],
      [0, height],
    ],
    [
      [0, height],
      [0, 0],
    ],
  ];

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
