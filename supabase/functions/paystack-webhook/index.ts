import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    metadata?: {
      promo_code?: string
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ─── Manual Verification (GET Method) ─────────────────────────────────
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const email = url.searchParams.get('email')
      
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      console.log('Manual verification requested for:', email)

      //1. Fetch transactions from Paystack for this email
      const paystackRes = await fetch(`https://api.paystack.co/transaction?customer=${email}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      })

      const paystackData = await paystackRes.json()
      
      if (!paystackData.status) {
        return new Response(JSON.stringify({ error: 'Failed to fetch from Paystack' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // 2. Find any successful transaction (amount ₵25 or more)
      const successfulTx = paystackData.data?.find((tx: any) => 
        tx.status === 'success' && tx.amount >= 1500 // Min fee is 15 GHS
      )

      if (successfulTx) {
        // 3. Update user in Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_paid: true,
            payment_date: successfulTx.paid_at || new Date().toISOString(),
            payment_reference: successfulTx.reference
          })
          .eq('email', email)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true, message: 'Payment linked successfully' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: false, message: 'No successful transactions found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ─── Webhook Handler (POST Method) ─────────────────────────────────────
    if (req.method === 'POST') {
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
        'raw', encoder.encode(paystackSecretKey),
        { name: 'HMAC', hash: 'SHA-512' },
        false, ['sign']
      )
      
      const computedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
      const expectedSig = Array.from(new Uint8Array(computedSig)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      if (expectedSig !== signature) {
        console.error('Invalid Paystack signature')
        return new Response('Invalid signature', { status: 401 })
      }

      // 4. Parse webhook event
      const event: PaystackWebhookEvent = JSON.parse(rawBody)
      console.log('Paystack webhook received:', event.event, 'Reference:', event.data.reference)
      
      // 5. Handle successful payment
      if (event.event === 'charge.success') {
        const { customer, reference, amount, paid_at, metadata } = event.data

        // SECURITY: Verify exact expected amount based on promo code
        const promoCode = metadata?.promo_code
        let expectedAmount = 2500 // Default: 25 GHS in pesewas

        if (promoCode) {
          // Query promo_codes table for discount amount
          const { data: promo } = await supabase
            .from('promo_codes')
            .select('discount_amount')
            .eq('code', promoCode.toUpperCase())
            .maybeSingle()

          const discount = promo?.discount_amount || 0
          expectedAmount = (25 - discount) * 100 // Calculate exact expected amount
        }

        // Verify EXACT amount match (not just minimum threshold)
        if (amount !== expectedAmount) {
          console.error(`Invalid Payment Amount: ${amount} does not match expected ${expectedAmount}`)
          return new Response('Invalid amount', { status: 400 })
        }

        const { data: user } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', customer.email)
          .single()

        if (!user) {
          console.error('User not found for email:', customer.email)
          return new Response('User not found', { status: 404 })
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_paid: true,
            payment_date: paid_at || new Date().toISOString(),
            payment_reference: reference
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating user status:', updateError)
          throw updateError
        }

        console.log(`Payment confirmed for user ${user.id}`)
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error: any) {
    console.error('Global Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
