import exportFromJSON from "export-from-json";
import pAll from "p-all";
import { Line } from "./types";

const VIEW_WIDTH = 400;
const DOWNSCALE_FACTOR = 2;

const WIDTH = VIEW_WIDTH * DOWNSCALE_FACTOR;
const HEIGHT = WIDTH;

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
  lines: { outlineLines: Line[]; allBranches: Line[]; leafLines: Line[] };
};

export const drawTree = (ctx: CanvasRenderingContext2D, seed: string) => {
  let finishLoading: () => void;
  let finishDrawing: () => void;

  const loadingPromise = new Promise((resolve) => {
    finishLoading = () => resolve(true);
  });

  const drawingPromise = new Promise((resolve) => {
    finishDrawing = () => resolve(true);
  });

  const getLinesWorker = new Worker(
    new URL("./getLinesWorker.ts", import.meta.url)
  );

  let isCancelled = false;
  let isFinished = false;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  getLinesWorker.postMessage({
    size: [WIDTH, HEIGHT],
    seed,
  });

  getLinesWorker.onmessage = async ({ data: { lines } }: { data: Data }) => {
    finishLoading();

    const { outlineLines, allBranches, leafLines } = lines;

    const drawLines = [allBranches, leafLines].flat();
    const allLines = [outlineLines, drawLines].flat();

    console.info(`Line Count: ${allLines.length}`);

    // @ts-ignore
    window.__downloadJSON = () => {
      exportFromJSON({
        data: allLines,
        fileName: `lines-${seed}`,
        exportType: "json",
      });
    };

    await pAll(
      drawLines.map((line, index) => async () => {
        if (isCancelled) {
          return;
        }
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        ctx.moveTo(line[0][0], line[0][1]);
        ctx.lineTo(line[1][0], line[1][1]);
        ctx.stroke();

        if (!isFinished) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }),
      { concurrency: 500 }
    );

    finishDrawing();
  };

  return {
    loadingPromise: loadingPromise,
    cancel: () => {
      getLinesWorker.terminate();
      isCancelled = true;
    },
    finish: async () => {
      isFinished = true;
      await drawingPromise;
    },
  };
};
