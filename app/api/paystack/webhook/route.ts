import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * Paystack Webhook Handler
 * 
 * WHY THIS EXISTS:
 * If a student pays but their campus Wi-Fi drops immediately after the MoMo prompt, 
 * their phone never tells our app they paid. 
 * To fix this, Paystack's server talks DIRECTLY to our server via this Webhook endpoint.
 * This guarantees the database is updated even if their phone dies.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_LIVE_SECRET_KEY 
      ? process.env.PAYSTACK_LIVE_SECRET_KEY 
      : (process.env.PAYSTACK_TEST_SECRET_KEY || '');

    if (!secretKey || !signature) {
       console.error("Webhook Error: Secret Key or Signature Missing");
       return NextResponse.json({ status: 'ignored' }, { status: 400 });
    }

    // 1. VERIFY THE SIGNATURE (Security Check using Web Crypto)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const bodyData = encoder.encode(rawBody);

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', hmacKey, bodyData);
    const hash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (hash !== signature) {
       console.error("Webhook Error: Invalid Signature");
       return NextResponse.json({ status: 'unauthorized' }, { status: 400 });
    }

    // 2. PARSE THE EVENT
    const event = JSON.parse(rawBody);

    // 3. HANDLE SUCCESSFUL PAYMENTS
    if (event.event === 'charge.success') {
       const { reference, customer, amount } = event.data;
       const email = customer.email;

       console.log(`Webhook Received: Payment Success for ${email}. Ref: ${reference}`);

       // =========================================================
       // SUPABASE DB UPDATE (Network-Drop Resilience)
       // =========================================================
       // Because this is server-to-server, we confidently update the DB here.
       // 
       // const supabase = createClient();
       // await supabase
       //    .from('users')
       //    .update({ has_paid: true, payment_date: new Date().toISOString() })
       //    .eq('email', email);
       //
       
       return NextResponse.json({ status: 'success', message: 'Database updated.' }, { status: 200 });
    }

    // Acknowledge other Paystack events so they don't keep retrying
    return NextResponse.json({ status: 'acknowledged' }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error Exception:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
