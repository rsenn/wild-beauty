"use strict";
const fs = require("fs");
const bytes = fs.readFileSync("./static/wasm/bpgdec.wasm");

(async () => {
  // Explicitly compile and then instantiate the wasm module.
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module);

  console.log(instance.exports.addTwo(8, 5));
})();

(async () => {
  // Instantiate the Wasm module with an implicit compilation step.
  const { instance, module } = await WebAssembly.instantiate(bytes);

  console.log(instance.exports.addTwo(8, 5));
})();
