import { NextRequest, NextResponse } from 'next/server';
import { QuoteFormData } from '@/types';

// The quote form also runs inside the Shopify store (product.quote template), which posts
// here from the store's origin. Only those origins may call this route cross-site.
const ALLOWED_ORIGINS = new Set([
  'https://www.wheelsbelowretail.com',
  'https://wheelsbelowretail.com',
  'https://rines-and-wheels.myshopify.com',
]);
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const body: Partial<QuoteFormData> = await req.json();
  const { wheelName, wheelImageUrl, name, email, phone, vehicleYear, vehicleMake, vehicleModel } = body;

  if (!wheelName || !name || !email || !phone || !vehicleYear || !vehicleMake || !vehicleModel) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: cors });
  }

  // Block bots: phone must be at least 10 digits, name must be letters only
  const phoneDigits = phone.replace(/\D/g, '');
  const validPhone = phoneDigits.length >= 10;
  const validName = name.trim().length >= 5 && /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-]+(\s+[a-zA-ZÀ-ÖØ-öø-ÿ'\-]+)+$/.test(name.trim());
  if (!validPhone || !validName) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 422, headers: cors });
  }

  // The shared Apps Script was written for the Forgiato site and only knows its columns.
  // Rows from here land in the same tab, so the brand goes on the wheel name and the
  // Rucci-only build options are folded into the notes column; the separate fields are
  // still sent for when the script learns about them.
  const buildNotes = [
    body.centerCap ? `Center cap: ${body.centerCap}` : '',
    body.staggered ? `Staggered: ${body.staggered}` : '',
    body.colorCode ? `Color code: ${body.colorCode}` : '',
    body.bigBrakes ? `Big brakes: ${body.bigBrakes}` : '',
    body.needTires ? `Tires: ${body.needTires}` : '',
  ].filter(Boolean).join(' · ');
  const sheetMessage = [buildNotes, body.message ?? ''].filter(Boolean).join('\n');

  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
  if (sheetsUrl) {
    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.SHEETS_SECRET ?? '',
          // Same Apps Script web app as the Forgiato site; it routes rows by `sheet`
          // into the "Rucci" tab of the shared workbook.
          sheet: 'Rucci',
          brand: 'Rucci Forged',
          wheelName: `RUCCI ${wheelName}`,
          wheelImageUrl: wheelImageUrl ?? '',
          name,
          email,
          phone,
          vehicleYear,
          vehicleMake,
          vehicleModel,
          sizePreference: body.sizePreference ?? '',
          finishPreference: body.finishPreference ?? '',
          colorCode: body.colorCode ?? '',
          centerCap: body.centerCap ?? '',
          staggered: body.staggered ?? '',
          bigBrakes: body.bigBrakes ?? '',
          needTires: body.needTires ?? '',
          message: sheetMessage,
        }),
      });
    } catch (err) {
      console.error('[Quote] Google Sheets error:', err);
    }
  }

  // Send SMS via Podium
  const refreshToken = process.env.PODIUM_REFRESH_TOKEN;
  if (refreshToken) {
    try {
      const tokenRes = await fetch('https://accounts.podium.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.PODIUM_CLIENT_ID,
          client_secret: process.env.PODIUM_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });
      const { access_token } = await tokenRes.json();

      if (access_token) {
        const podiumHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        };

        // Notify dealer
        const finish = body.finishPreference
          ? `${body.finishPreference}${body.colorCode ? ` (${body.colorCode})` : ''}`
          : 'N/A';
        const extras = [
          body.staggered ? `Staggered: ${body.staggered}` : '',
          body.centerCap ? `Cap: ${body.centerCap}` : '',
          body.bigBrakes ? `Big brakes: ${body.bigBrakes}` : '',
          body.needTires ? `Tires: ${body.needTires}` : '',
        ].filter(Boolean).join('\n');
        const dealerSms = `New RUCCI quote!\nWheel: ${wheelName}\nSize: ${body.sizePreference || 'N/A'}\nFinish: ${finish}${extras ? `\n${extras}` : ''}\nFrom: ${name}\nPhone: ${phone}\nVehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel}${wheelImageUrl ? `\n${wheelImageUrl}` : ''}`;
        await fetch('https://api.podium.com/v4/messages', {
          method: 'POST',
          headers: podiumHeaders,
          body: JSON.stringify({
            body: dealerSms,
            locationUid: process.env.PODIUM_LOCATION_UID,
            channel: { identifier: process.env.PODIUM_DEALER_PHONE, type: 'phone' },
          }),
        });

        // Confirm to customer
        const firstName = name.trim().split(' ')[0];
        const customerSms = `Hi ${firstName}, thanks for your interest in the Rucci Forged ${wheelName}! We received your quote request and will reach out shortly with pricing and build time. - Wheels Below Retail`;
        await fetch('https://api.podium.com/v4/messages', {
          method: 'POST',
          headers: podiumHeaders,
          body: JSON.stringify({
            body: customerSms,
            locationUid: process.env.PODIUM_LOCATION_UID,
            channel: { identifier: phone, type: 'phone' },
          }),
        });
      }
    } catch (err) {
      console.error('[Quote] Podium SMS error:', err);
    }
  }

  return NextResponse.json({ success: true }, { headers: cors });
}
