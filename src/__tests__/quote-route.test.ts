/**
 * @jest-environment node
 */
import { POST } from '@/app/api/quote/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/quote', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_BODY = {
  wheelName: "D'Uno",
  name: 'John Smith',
  email: 'john@example.com',
  phone: '555-123-4567',
  vehicleYear: '2023',
  vehicleMake: 'BMW',
  vehicleModel: 'M5',
};

test('returns 200 with all required fields', async () => {
  const res = await POST(makeRequest(VALID_BODY));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.success).toBe(true);
});

test('returns 400 when vehicle fields missing', async () => {
  const res = await POST(makeRequest({ wheelName: "D'Uno", name: 'John', email: 'j@j.com', phone: '555' }));
  expect(res.status).toBe(400);
});

test('returns 400 when contact fields missing', async () => {
  const res = await POST(makeRequest({ wheelName: "D'Uno", vehicleYear: '2023', vehicleMake: 'BMW', vehicleModel: 'M5' }));
  expect(res.status).toBe(400);
});

test('posts to the shared Google Sheet with the Rucci tab name', async () => {
  process.env.GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/test/exec';
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  global.fetch = fetchMock as unknown as typeof fetch;
  await POST(makeRequest({ ...VALID_BODY, finishPreference: 'Chrome', sizePreference: '26"', centerCap: 'Large cap', needTires: 'No, just the wheels', message: 'lifted 4in' }));
  const [, init] = fetchMock.mock.calls[0];
  const sent = JSON.parse((init as RequestInit).body as string);
  expect(sent.sheet).toBe('Rucci');
  expect(sent.finishPreference).toBe('Chrome');
  // shared Forgiato tab: brand on the wheel name, Rucci-only options folded into the notes column
  expect(sent.wheelName).toBe("RUCCI D'Uno");
  expect(sent.message).toBe('Center cap: Large cap · Tires: No, just the wheels\nlifted 4in');
  expect(sent.centerCap).toBe('Large cap');
  delete process.env.GOOGLE_SHEETS_URL;
});
