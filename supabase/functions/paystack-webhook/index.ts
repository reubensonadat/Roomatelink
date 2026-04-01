import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno types for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface PaystackWebhookEvent {
  event: string
  data: {
    customer: {
      email: string
      first_name: string
      last_name: string
    }
    amount: number
    reference: string
    status: string
    paid_at: string
  }
}

serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // 1. Get raw body for signature verification
    const rawBody = await req.text()
    
    // 2. Get Paystack signature from headers
    const signature = req.headers.get('x-paystack-signature')
    
    if (!signature) {
      console.error('Missing Paystack signature')
      return new Response('Missing signature', { status: 401 })
    }

    // 3. Verify signature using Web Crypto API
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    
    const computedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const expectedSig = Array.from(new Uint8Array(computedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSig !== signature) {
      console.error('Invalid Paystack signature')
      return new Response('Invalid signature', { status: 401 })
    }

    // 4. Parse webhook event
    const event: PaystackWebhookEvent = JSON.parse(rawBody)

    console.log('Paystack webhook received:', event.event, 'Reference:', event.data.reference)

    // 5. Handle successful payment
    if (event.event === 'charge.success') {
      const { customer, reference, amount, paid_at } = event.data

      // Find user by email
      const { data: user } = await supabase
        .from('users')
        .select('id, email, has_paid, payment_date')
        .eq('email', customer.email)
        .single()

      if (!user) {
        console.error('User not found for email:', customer.email)
        return new Response('User not found', { status: 404 })
      }

      // Update user payment status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          has_paid: true,
          payment_date: paid_at || new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user payment status:', updateError)
        throw updateError
      }

      console.log(`Payment verified for user ${user.id}, reference: ${reference}, amount: ${amount}`)
    }

    // 6. Return success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
