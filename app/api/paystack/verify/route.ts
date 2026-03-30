import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client — bypasses RLS so we can always update has_paid regardless of policies
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Paystack Transaction Verification Endpoint
 * Method: POST
 * Body: { reference: string, email: string, amount: number }
 */
export async function POST(request: Request) {
  try {
    const { reference, email, amount } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.NODE_ENV === 'production' && process.env.PAYSTACK_LIVE_SECRET_KEY
      ? process.env.PAYSTACK_LIVE_SECRET_KEY
      : process.env.PAYSTACK_TEST_SECRET_KEY;

    if (!secretKey) {
      console.error('SERVER ERROR: PAYSTACK_SECRET_KEY is missing from .env.local');
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Contact support.' },
        { status: 500 }
      );
    }

    // Step 1: Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Check if the Paystack API call itself failed
    if (!data.status) {
      return NextResponse.json(
        { success: false, error: data.message || 'Verification failed at Paystack.' },
        { status: 400 }
      );
    }

    const { status, amount: paidAmount, customer } = data.data;

    // Step 2: Transaction confirmed successful
    if (status === 'success') {

      // Step 3: Update the user's payment status in Supabase
      const supabase = createAdminClient();
      const userEmail = customer?.email || email;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          has_paid: true,
          payment_date: new Date().toISOString(),
          payment_reference: reference,
        })
        .eq('email', userEmail);

      if (updateError) {
        // Don't fail the whole request — payment was real, log for manual reconciliation
        console.error('⚠️ Payment confirmed but DB update failed:', updateError.message);
      } else {
        console.log(`✅ Payment confirmed & DB updated for: ${userEmail}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully. Welcome to Premium!',
        verifiedData: { status, paidAmount, customer }
      });
    }

    // Payment was abandoned or failed
    return NextResponse.json({
      success: false,
      error: `Payment was not successful. Status: ${status}`,
    }, { status: 400 });

  } catch (error) {
    console.error('Paystack Verification Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during payment verification.' },
      { status: 500 }
    );
  }
}
