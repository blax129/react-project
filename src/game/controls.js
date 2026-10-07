export const GAS_KEYS = ['ArrowRight','ArrowUp','KeyD','Space'];
export const BRAKE_KEYS = ['ArrowLeft','ArrowDown','KeyA'];

// Keep each key/finger separate: releasing one must not release another.
export function createInputState(controls) {
  const sources = new Map();
  function sync() {
    for (const name of ['gas','brake','left','right']) {
      controls[name] = [...sources.values()].includes(name);
    }
  }
  return {
    press(source, name) { sources.set(source,name); sync(); },
    release(source) { sources.delete(source); sync(); },
    clear() { sources.clear(); sync(); },
  };
}
