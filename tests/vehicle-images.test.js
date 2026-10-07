import test from 'node:test';
import assert from 'node:assert/strict';
import { createImageCache } from '../src/game/vehicleImages.js';

test('shared load waits for decoding and reuses the decoded image', async () => {
  let finishDecode;
  const image = { decode: () => new Promise(resolve => { finishDecode = resolve; }) };
  const cache = createImageCache(() => image);
  const pending = cache.load('ride.webp');
  assert.equal(cache.load('ride.webp'), pending);
  let ready = false;
  pending.then(() => { ready = true; });
  image.onload();
  await Promise.resolve();
  assert.equal(ready, false);
  finishDecode();
  assert.equal(await pending, image);
  assert.equal(cache.get('ride.webp'), image);
});

test('failed download or decode can be retried', async () => {
  const images = [];
  const cache = createImageCache(() => { const image = {}; images.push(image); return image; });
  const first = cache.load('ride.webp');
  images[0].onerror();
  await assert.rejects(first);
  assert.equal(cache.get('ride.webp'), undefined);
  const second = cache.load('ride.webp');
  images[1].decode = () => Promise.reject(new Error('decode failed'));
  await images[1].onload();
  await assert.rejects(second);
  const third = cache.load('ride.webp');
  await images[2].onload();
  assert.equal(await third, images[2]);
});
