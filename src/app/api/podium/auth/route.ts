import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.PODIUM_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://forgiato-forged-wheels-catalog.vercel.app'}/api/podium/callback`;

  const url = new URL('https://accounts.podium.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');

  return NextResponse.redirect(url.toString());
}
