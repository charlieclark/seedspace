import { Line } from "./types";

const getLinesWorker = new Worker(
  new URL("./getLinesWorker.ts", import.meta.url)
);

const WIDTH = 800;
const HEIGHT = 800;
const DOWNSCALE_FACTOR = 2;

export const setupCanvas = (canvas: HTMLCanvasElement) => {
  canvas.style.width = WIDTH / DOWNSCALE_FACTOR + "px";
  canvas.style.height = HEIGHT / DOWNSCALE_FACTOR + "px";

  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(WIDTH * scale);
  canvas.height = Math.floor(HEIGHT * scale);

  const ctx = canvas.getContext("2d");

  ctx.scale(scale, scale);

  return ctx;
};

type Data = {
  lines: Line[][];
};

export const drawTree = (ctx: CanvasRenderingContext2D, seed: string) => {
  let isCancelled = false;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  getLinesWorker.postMessage({
    size: [WIDTH, HEIGHT],
    seed,
  });

  getLinesWorker.onmessage = ({ data: { lines } }: { data: Data }) => {
    const [branches, leaves] = lines;

    branches.forEach(async (line, index) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (isCancelled) {
        return;
      }
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.moveTo(line[0][0], line[0][1]);
      ctx.lineTo(line[1][0], line[1][1]);
      ctx.stroke();
    });

    leaves.forEach(async (line, index) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (isCancelled) {
        return;
      }
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.moveTo(line[0][0], line[0][1]);
      ctx.lineTo(line[1][0], line[1][1]);
      ctx.stroke();
    });
  };

  return () => {
    isCancelled = true;
  };
};
