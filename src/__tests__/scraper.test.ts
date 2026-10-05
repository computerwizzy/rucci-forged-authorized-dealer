/**
 * @jest-environment node
 */
import { getWheels, clearCache } from '@/lib/scraper';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}));

import * as fs from 'fs';
const readFileSync = fs.readFileSync as jest.Mock;
const SAMPLE = [{ name: 'Casket', series: '5 spoke', imageUrl: '/wheels/casket-1.webp', slug: 'casket' }];

beforeEach(() => {
  clearCache();
  jest.clearAllMocks();
  readFileSync.mockReturnValue(JSON.stringify(SAMPLE));
});

test('getWheels reads the catalog data file', async () => {
  const wheels = await getWheels();
  expect(wheels).toEqual(SAMPLE);
  expect(readFileSync).toHaveBeenCalledTimes(1);
});

test('getWheels serves from cache on the second call', async () => {
  await getWheels();
  await getWheels();
  expect(readFileSync).toHaveBeenCalledTimes(1);
});

test('clearCache forces a re-read', async () => {
  await getWheels();
  clearCache();
  await getWheels();
  expect(readFileSync).toHaveBeenCalledTimes(2);
});
