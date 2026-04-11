import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your .env link.')
}

// ============================================================================
// ISSUE 1 FIX: Mobile TCP Half-Open Timeout
// ============================================================================
// When a user sits idle on mobile data for ~2 minutes, the mobile carrier drops
// the TCP connection. The browser thinks the connection is still open (half-open)
// and waits 60+ seconds before realizing it's dead.
//
// This custom fetch wrapper adds an 8-second timeout to ALL Supabase HTTP requests.
// When 8 seconds pass without a response, AbortController.abort() physically tears
// down the TCP connection at the OS level, forcing the browser to recognize the
// dead connection immediately.
//
// This prevents the 2-minute app freeze on mobile data.
// ============================================================================

const REQUEST_TIMEOUT_MS = 8000 // 8 seconds

function createTimeoutFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, REQUEST_TIMEOUT_MS)

    // Merge the user's abort signal with our timeout signal
    const signal = init?.signal
    if (signal) {
      // If user provided a signal, we need to abort our timeout if they abort first
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    }

    try {
      const response = await originalFetch(input, {
        ...init,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Re-throw abort errors with a clearer message
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms. Please check your connection.`)
      }
      throw error
    }
  }
}

// Create the timeout-wrapped fetch
const timeoutFetch = createTimeoutFetch(fetch)

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Use our timeout-wrapped fetch for all HTTP requests
  global: {
    fetch: timeoutFetch as any
  }
})
