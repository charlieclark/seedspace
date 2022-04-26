import getLines from "./getLines";

const WIDTH = 500;
const HEIGHT = 500;

const tree = (canvas: HTMLCanvasElement) => {
  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";

  // Set actual size in memory (scaled to account for extra pixel density).
  var scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
  canvas.width = Math.floor(WIDTH * scale);
  canvas.height = Math.floor(HEIGHT * scale);

  const ctx = canvas.getContext("2d");

  // Normalize coordinate system to use CSS pixels.
  ctx.scale(scale, scale);

  const lines = getLines([WIDTH, HEIGHT], [WIDTH / 2, HEIGHT]);

  console.log(lines.length)

  lines.forEach((line) => {
    ctx.moveTo(line[0][0], line[0][1]);
    ctx.lineTo(line[1][0], line[1][1]);
    ctx.stroke();
  });
};

export default tree;
