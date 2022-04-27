declare var require: any;
require("../css/main.css");

import qs from "qs";
import { setupCanvas, drawTree } from "./tree";
import randomWords from "random-words";

enum HandlerIds {
  randomize = "randomize",
  share = "share",
  download = "download",
}

const getCurrentUrl = () => {
  return location.protocol + "//" + location.host + location.pathname;
};

const getSeedParam = () => {
  const { seed } = qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  });
  return seed as string;
};

const getInputNode = () => {
  return document.body.querySelector("input");
};

const init = () => {
  const ctx = setupCanvas(document.querySelector("canvas"));

  let currentCancel: () => void;

  const toggleLoading = (isLoading: boolean) => {
    document.body.classList.toggle("loading", isLoading);
  };

  const setOrRandomizeSeed = async (seed: string | null) => {
    seed = seed || randomWords();

    if (seed !== getSeedParam()) {
      const newUrl =
        getCurrentUrl() + qs.stringify({ seed }, { addQueryPrefix: true });
      console.log({ newUrl });
      history.replaceState(null, "", newUrl);
    }

    if (seed !== getInputNode().value) {
      getInputNode().value = seed;
    }

    if (currentCancel) {
      currentCancel();
    }

    const { cancel, loadingPromise } = drawTree(ctx, seed as string);

    currentCancel = cancel;

    toggleLoading(true);

    await loadingPromise;

    toggleLoading(false);
  };

  const clickHandlers = {
    [HandlerIds.randomize]: () => {
      setOrRandomizeSeed(null);
    },
    [HandlerIds.share]: () => {
      console.log("share");
    },
    [HandlerIds.download]: () => {
      console.log("download");
    },
  };

  document.body.addEventListener(
    "click",
    (e: Event & { target: HTMLElement }) => {
      const handlerId = e.target.dataset.click as HandlerIds;
      if (handlerId) {
        clickHandlers[handlerId]();
      }
    }
  );

  document.body
    .querySelector("form")
    .addEventListener("submit", (e: Event & { target: HTMLFormElement }) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const { seed } = Object.fromEntries(formData);
      setOrRandomizeSeed(seed as string);
      getInputNode().blur();
    });

  // init
  setOrRandomizeSeed(getSeedParam());
};

init();
