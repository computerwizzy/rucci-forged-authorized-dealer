import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'No code received from Podium' }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://forgiato-forged-wheels-catalog.vercel.app'}/api/podium/callback`;

  const res = await fetch('https://accounts.podium.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PODIUM_CLIENT_ID,
      client_secret: process.env.PODIUM_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const data = await res.json();

  if (!data.refresh_token) {
    return NextResponse.json({ error: 'No refresh token returned', data }, { status: 400 });
  }

  // Show the refresh token so you can copy it into PODIUM_REFRESH_TOKEN env var
  return NextResponse.json({
    message: 'Copy this refresh_token into your PODIUM_REFRESH_TOKEN environment variable on Vercel and in .env.local',
    refresh_token: data.refresh_token,
    access_token: data.access_token,
  });
}
