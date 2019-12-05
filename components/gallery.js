import React, { Component } from "react";
import { Flipper, Flipped } from "react-flip-toolkit";
import Util from "../utils/util.js";
import Alea from "../utils/alea.js";
import anime from "animejs";
import { RandomColor } from "../utils/dom.js";
import Layer from "../components/layer.js";

const imageNames = [
  "04b79de115044501f1358f829130438d",
  "0c71247f63ff20833347da1484d3caa4",
  "2a5c935eaf38ee7da68a6208730d6388",
  "4112bc4fca9ef56f8982de334e9a3afc",
  "63a5110bf12b0acef2f68e0e1a023502",
  "69353138_350963942449628_6079377653159165952_n",
  "69536222_653691828474365_6429980850053447680_n",
  "69688821_689014168592533_7393339862767632384_n",
  "69738320_488180518412115_8495700638703812608_n",
  "70285928_389116288450926_7739364985301630976_n",
  "75264909_541441350014341_6284290667405377536_n",
  "76619287_430389744517453_4826291339341594624_n",
  "76771501_2539648529692993_599570957710917632_n",
  "86463ed8ed391bf6b0a2907df74adb37",
  "8cb3c5366cc81b5fe3e061a65fbf4045",
  "cdb466a69cc7944809b20e7f34840486",
  "d415b80a6007124c4e3948b21a7f0ed1",
  "e192e59519fd905d40532f748e65fbf2",
  "e758ee9aafbc843a1189ff546c56e5b5",
  "fdcce856cf66f33789dc3934418113a2"
];

/**
 * Gets the random numbers.
 *
 * @return     {Array}  The random numbers.
 */
export const getRandomNumbers = () => {
  return [...new Array(100).keys()].filter(n => Math.random() > 0.5);
};

const hashPath = path => {
  const INT32_MAX = 2147483647;
  return () => Util.hashString(path, 32, INT32_MAX) / INT32_MAX;
};
const defaultImageProps = { style: { width: "100%", maxWidth: "100px", maxHeight: "150px" } };

/**
 * Gets the random images.
 *
 * @return     {<type>}  The random images.
 */
export const randomImagePaths = (names = imageNames) => {
  let images = names.map(name => `static/img/${name}.jpg`);
  const rnd = Alea.singleton();

  images = Util.shuffle(images, rnd);
  const num = Math.floor(rnd() * (images.length - 3) + 3);
  // images = images.slice(0, num - 1);
  console.log("random Images: ", images);
  if("window" in global) window.images = images;
  return images;
};

export const RandomImages = (arg => {
  const { width, height, style, ...rest } = arg || {};
  return props => {
    if(!style) style = {};
    style = { ...style, width, height: height ? height : "auto" };
    props = { ...rest, style };
    return randomImagePaths().map(path => (
      <img src={path} border={0} alt={path.replace(/.*\//g, "")} {...props} />
    ));
  };
})(defaultImageProps);

/**
 * <ImageList images={[ paths... ]} />
 */
export const ImageList = ({ images }) => images.map(img => <ImageLayer src={img} />);

/**
 * <ImageLayer path="" bgcolor="" />
 *
 */
export const ImageLayer = ({ path, bgcolor = RandomColor() }) => {
  return (
    <Layer inline style={{ flex: "1 0 auto", backgroundColor: bgcolor }}>
      <img
        src={path}
        style={{ maxWidth: "20vmin", maxHeight: "50vmin", width: "100%" }}
        className="gallery-image"
      />
    </Layer>
  );
};

// one of the three callbacks below is passed to the
// handlegallery- prop of the Flipper component

// all animations happen at the same time
const simultaneousAnimations = ({
  hideEnteringElements,
  animateEnteringElements,
  animateExitingElements,
  animateFlippedElements
}) => {
  hideEnteringElements();
  animateExitingElements();
  animateFlippedElements();
  animateEnteringElements();
};

// wait for exiting elements to be removed
// next, animate updating elements
// finally, after updates are complete,
// animate entering elements
const exitThenFlipThenEnter = ({
  hideEnteringElements,
  animateEnteringElements,
  animateExitingElements,
  animateFlippedElements
}) => {
  hideEnteringElements();
  animateExitingElements()
    .then(animateFlippedElements)
    .then(animateEnteringElements);
};

// animate exiting and updating elements simultaneously
// then, when both are complete, animate in new elements
const exitAndFlipThenEnter = ({
  hideEnteringElements,
  animateEnteringElements,
  animateExitingElements,
  animateFlippedElements
}) => {
  hideEnteringElements();
  Promise.all([animateExitingElements(), animateFlippedElements()]).then(animateEnteringElements);
};

const transitions = {
  simultaneousAnimations,
  exitThenFlipThenEnter,
  exitAndFlipThenEnter
};

const animateElementIn = (el, i) =>
  anime({
    targets: el,
    opacity: 1,
    delay: i * 10,
    easing: "easeOutSine"
  });

const animateElementOut = (el, i, onComplete) => {
  el.style.color = "red";
  anime({
    targets: el,
    opacity: 0,
    delay: i * 10,
    easing: "easeOutSine",
    complete: onComplete
  });
};

/**
 * This class describes a gallery.
 *
 * @class      Gallery (name)
 */
export class Gallery extends Component {
  state = { list: randomImagePaths(), transitionType: "exitThenFlipThenEnter" };

  updateList = () => {
    const list = randomImagePaths();
    this.setState({ list });
  };

  render() {
    return (
      <div className="gallery-container">
        <div>
          <h2>Enter/update/delete animation order</h2>
          {Object.keys(transitions).map((transition, i) => {
            return (
              <label key={i} className="gallery-label">
                <input
                  type="radio"
                  name="transition"
                  value={transition}
                  checked={transition === this.state.transitionType}
                  onChange={ev =>
                    this.setState({
                      transitionType: ev.currentTarget.value,
                      list: randomImagePaths()
                    })
                  }
                />
                {transition}
              </label>
            );
          })}
        </div>
        <Flipper
          flipKey={this.state.list.join(", ")}
          element="ul"
          className="gallery-list"
          handleEnterUpdateDelete={transitions[this.state.transitionType]}
        >
          {this.state.list.map(d => (
            <Flipped
              key={d}
              flipId={d.toString()}
              onAppear={animateElementIn}
              onExit={animateElementOut}
            >
              <div className={"centered"}>
                <img src={d} {...defaultImageProps} />
                {/*d.replace(/.*\//g, '').replace(/\.[a-z]*$/g, '')*/}
              </div>
            </Flipped>
          ))}
        </Flipper>
        <style jsx global>{`
          .gallery-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
          }
          .centered {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .centered {
            border: 2px dashed orange;
            margin: 2px;
            overflow: "hidden";
          }

          .gallery-list {
            display: flex;
            flex-wrap: wrap;
            list-style: none;
            width: 100%;
          }

          .gallery-list li {
            display: inline-block;
            font-size: 1.5rem;
          }

          .gallery-label {
            margin: 0.5rem;
            display: inline-block;
          }

          .gallery-label > input {
            margin-right: 0.5rem;
          }
        `}</style>
      </div>
    );
  }
}
export default Gallery;
