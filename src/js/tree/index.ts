import getLines from "./getLines";

const WIDTH = 800;
const HEIGHT = 800;

const tree = async (canvas: HTMLCanvasElement) => {
  canvas.style.width = WIDTH / 2 + "px";
  canvas.style.height = HEIGHT / 2 + "px";

  // Set actual size in memory (scaled to account for extra pixel density).
  var scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
  canvas.width = Math.floor(WIDTH * scale);
  canvas.height = Math.floor(HEIGHT * scale);

  const ctx = canvas.getContext("2d");

  // Normalize coordinate system to use CSS pixels.
  ctx.scale(scale, scale);

  const [branches, leaves] = await getLines([WIDTH, HEIGHT]);

  console.log([...branches, ...leaves].length);

  branches.forEach(async (line, index) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(line[0][0], line[0][1]);
    ctx.lineTo(line[1][0], line[1][1]);
    ctx.stroke();
  });

  leaves.forEach(async (line, index) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(line[0][0], line[0][1]);
    ctx.lineTo(line[1][0], line[1][1]);
    ctx.stroke();
  });
};

export default tree;
