import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your .env link.')
}

const REQUEST_TIMEOUT_MS = 8000 // 8 seconds

function createTimeoutFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout>

    // THE FIX: Link React's cancel signal to our controller
    if (init?.signal) {
      if (init.signal.aborted) {
        // If React already cancelled it before we started, abort immediately
        controller.abort()
      } else {
        // If React cancels it while we are waiting, we abort our controller too
        const onCallerAbort = () => controller.abort()
        init.signal.addEventListener('abort', onCallerAbort, { once: true })
        
        // Clean up the listener if our timer or fetch finishes first
        controller.signal.addEventListener('abort', () => {
          init.signal?.removeEventListener('abort', onCallerAbort)
        }, { once: true })
      }
    }

    timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await originalFetch(input, {
        ...init,
        signal: controller.signal // Pass our unified controller
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        // THE FIX: If React cancelled it (user switched pages), DO NOT RETRY. Just fail silently.
        if (init?.signal?.aborted) {
          throw new DOMException('The user aborted a request.', 'AbortError')
        }

        // Second chance: ONLY retry if it was a genuine network timeout
        const retryController = new AbortController()
        const retryTimeoutId = setTimeout(() => retryController.abort(), REQUEST_TIMEOUT_MS)

        // Link React's signal to the retry controller too
        if (init?.signal) {
          const onCallerAbort = () => retryController.abort()
          init.signal.addEventListener('abort', onCallerAbort, { once: true })
          retryController.signal.addEventListener('abort', () => {
            init.signal?.removeEventListener('abort', onCallerAbort)
          }, { once: true })
        }

        try {
          const retryResponse = await originalFetch(input, {
            ...init,
            signal: retryController.signal
          })
          clearTimeout(retryTimeoutId)
          return retryResponse
        } catch (retryError) {
          clearTimeout(retryTimeoutId)
          // If React cancelled it during the retry, throw AbortError to silently die
          if (init?.signal?.aborted) {
            throw new DOMException('The user aborted a request.', 'AbortError')
          }
          throw new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms. Please check your connection.`)
        }
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
  global: {
    fetch: timeoutFetch as any
  }
})