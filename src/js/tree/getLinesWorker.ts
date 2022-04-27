import getLines, { p } from "./getLines";

type Data = {
  size: number[];
  seed: string;
};

onmessage = ({ data: { size, seed } }: { data: Data }) => {
  postMessage({ lines: getLines(p(size[0], size[1]), seed) });
};
