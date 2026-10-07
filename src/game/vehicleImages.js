// Share decoded artwork between the picker and the canvas. Failures can be retried.
export function createImageCache(makeImage = () => new Image()) {
  const entries = new Map();
  return {
    get(url) { return entries.get(url)?.image; },
    load(url) {
      if (entries.has(url)) return entries.get(url).promise;
      const image = makeImage();
      const promise = new Promise((resolve, reject) => {
        image.onload = async () => {
          try {
            if (image.decode) await image.decode();
            resolve(image);
          } catch (error) { entries.delete(url); reject(error); }
        };
        image.onerror = () => { entries.delete(url); reject(new Error('Vehicle image could not load')); };
      });
      entries.set(url, { image, promise });
      image.src = url;
      return promise;
    },
  };
}
export const vehicleImages = createImageCache();
