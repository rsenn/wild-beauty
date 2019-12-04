import { trkl } from './trkl.js';

export function Instance({ trackable = false, callback, initVal = null }) {
  let inst = trackable && trackable.subscribe !== undefined ? trackable : trkl(initVal);

  if(callback) inst.subscribe(value => callback(value, inst));
  inst.subscribe(newVal => {
    if(newVal) console.log('new instance: ', value);
  });
  /*else*/
  /*  inst.subscribe(value => {
    if(value) inst.current = value; 
  });
*/
  trkl.property(inst, 'current', inst);
  return inst;
}

function TrackedInstance(initVal = null) {
  const callback = value => {};
  var inst = Instance({ trackable: true, callback, initVal });

  return inst;
}

export function lazyInitializer(fn, opts = {}) {
  let inst = trkl(null);
  var handler = function(value) {
    if(inst() === null) {
      const initVal = fn(inst);
      console.log('initialized to: ', initVal);
      inst(initVal);
      inst.unsubscribe(handler);
    }
  };
  inst.subscribe(handler);
  return inst;
}

export function valueInitializer(createFunction, onInit) {}
