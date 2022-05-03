declare var require: any;
require("../css/main.css");

import qs from "qs";
import { setupCanvas, drawTree } from "./tree";
import randomWords from "random-words";
// @ts-ignore
import canvasToImage from "canvas-to-image";
import copy from "copy-to-clipboard";

window.addEventListener("load", () => {
  document.body.classList.add("ready");
});

enum HandlerIds {
  randomize = "randomize",
  share = "share",
  download = "download",
  overlay = "overlay",
  about = "about",
  prints = "prints",
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

const getLocationWithSeedParam = (seed: string) => {
  return getCurrentUrl() + qs.stringify({ seed }, { addQueryPrefix: true });
};

const getInputNode = () => {
  return document.body.querySelector("input");
};

const toggleModal = (text: string | null, autohide = false) => {
  if (text) {
    document.querySelector(".modal").innerHTML = text;
  }
  document.body.classList.toggle("modal-showing", !!text);

  if (autohide) {
    setTimeout(() => toggleModal(null), 3000);
  }
};

const init = () => {
  const canvas = document.querySelector("canvas");
  const ctx = setupCanvas(canvas);

  let currentCancel: () => void;
  let currentFinish: () => void;

  const toggleLoading = (isLoading: boolean) => {
    document.body.classList.toggle("loading", isLoading);
  };

  const setOrRandomizeSeed = async (seed: string | null) => {
    seed = seed ? seed.trim().toLowerCase() : randomWords();

    if (seed !== getSeedParam()) {
      const newUrl = getLocationWithSeedParam(seed);
      console.log({ newUrl });
      history.replaceState(null, "", newUrl);
    }

    if (seed !== getInputNode().value) {
      getInputNode().value = seed;
    }

    if (currentCancel) {
      currentCancel();
    }

    const { cancel, finish, loadingPromise } = drawTree(ctx, seed as string);

    currentCancel = cancel;
    currentFinish = finish;

    toggleLoading(true);

    await loadingPromise;

    toggleLoading(false);
  };

  const clickHandlers = {
    [HandlerIds.randomize]: () => {
      setOrRandomizeSeed(null);
    },
    [HandlerIds.share]: () => {
      const url = getLocationWithSeedParam(getSeedParam());
      if (navigator.share) {
        navigator.share({ url });
      } else {
        toggleModal("copied link to clipboard", true);
        copy(url);
      }
    },
    [HandlerIds.download]: async () => {
      if (currentFinish) {
        await currentFinish();
      }
      canvasToImage(canvas, {
        name: `seedspace-${getSeedParam()}`,
        type: "png",
        quality: 1,
      });
    },
    [HandlerIds.overlay]: async () => {
      toggleModal(null);
    },
    [HandlerIds.about]: async () => {
      toggleModal(
        `
        pen-plottable seeded random tree generator
        <br/>
        –
        <br/>
        built by <a target="_blank" href="http://www.builtby.cc">Charlie Clark</a>
        <br/>
        during a <a target="_blank" href="http://squarespace.com/">Squarespace</a> hackweek`
      );
    },
    [HandlerIds.prints]: async () => {
      toggleModal(
        `
        a pen plotter can be used to draw the trees
        <br/>
        <br/>
        <img style="width:100%;" src="https://raw.githubusercontent.com/charlieclark/seedspace/39cf6383c3bf50aa80620d805e5b0ee483743361/src/images/pen-plotter.gif" />
        <br/>
        <br/>
        <a target="_blank" href="http://www.builtby.cc">Contact me</a> if you'd like one!
        <br/>
        <br/>
        <img style="width:100%;" src="https://raw.githubusercontent.com/charlieclark/seedspace/39cf6383c3bf50aa80620d805e5b0ee483743361/src/images/drawing.jpg" />
        `
      );
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
      const { seed = "" } = Object.fromEntries(formData);
      setOrRandomizeSeed(seed as string);
      getInputNode().blur();
    });

  // init
  setOrRandomizeSeed(getSeedParam());
};

init();
