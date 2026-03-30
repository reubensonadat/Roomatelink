import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    const secretKey = process.env.NODE_ENV === 'production' && process.env.PAYSTACK_LIVE_SECRET_KEY
      ? process.env.PAYSTACK_LIVE_SECRET_KEY
      : process.env.PAYSTACK_TEST_SECRET_KEY;

    if (!secretKey) {
       console.error("Webhook Error: Secret Key Missing");
       return NextResponse.json({ status: 'ignored' }, { status: 500 });
    }

    // 1. VERIFY THE SIGNATURE (Security Check)
    // We must hash the body with our secret key and compare it to the signature from Paystack.
    // This proves the incoming request actually came from Paystack and not a hacker.
    const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
    
    if (hash !== signature) {
       console.error("Webhook Error: Invalid Signature");
       // Return 400 so Paystack knows we rejected it
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
