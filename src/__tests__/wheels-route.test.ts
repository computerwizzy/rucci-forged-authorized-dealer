/**
 * @jest-environment node
 */
import { GET } from '@/app/api/wheels/route';
import { getWheels } from '@/lib/scraper';
import { NextRequest } from 'next/server';
import { Wheel } from '@/types';

jest.mock('@/lib/scraper');
const mockedGetWheels = getWheels as jest.MockedFunction<typeof getWheels>;

const MOCK_WHEELS: Wheel[] = [
  { name: "D'Uno", series: 'Classics', imageUrl: 'https://forgiato.com/d-uno.jpg', slug: 'd-uno' },
];

test('returns 200 with wheels array', async () => {
  mockedGetWheels.mockResolvedValue(MOCK_WHEELS);
  const res = await GET(new NextRequest('http://localhost:3000/api/wheels'));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.wheels).toEqual(MOCK_WHEELS);
});

test('returns 500 when scraper throws', async () => {
  mockedGetWheels.mockRejectedValue(new Error('Network error'));
  const res = await GET(new NextRequest('http://localhost:3000/api/wheels'));
  expect(res.status).toBe(500);
});
