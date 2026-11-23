import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateResizedDimensions } from './imageCompression.ts';

test('calculateResizedDimensions scales wide images down to maxWidth 1024 preserving aspect ratio', () => {
  assert.deepEqual(calculateResizedDimensions(2048, 1024, 1024), { width: 1024, height: 512 });
  assert.deepEqual(calculateResizedDimensions(4000, 3000, 1024), { width: 1024, height: 768 });
});

test('calculateResizedDimensions does not upscale images smaller than or equal to maxWidth', () => {
  assert.deepEqual(calculateResizedDimensions(800, 600, 1024), { width: 800, height: 600 });
  assert.deepEqual(calculateResizedDimensions(1024, 1536, 1024), { width: 1024, height: 1536 });
});

test('calculateResizedDimensions handles invalid or zero dimensions safely', () => {
  assert.deepEqual(calculateResizedDimensions(0, 0, 1024), { width: 1024, height: 1024 });
  assert.deepEqual(calculateResizedDimensions(Number.NaN, 500, 1024), { width: 1024, height: 500 });
});
