import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/messages/send
 * 
 * Sends a chat message to another user
 * 
 * Request body:
 * {
 *   receiverId: string
 *   content: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { receiverId, content } = body
    
    // 2. Validate input
    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }
    
    // 3. Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // 4. Get sender's internal ID
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()
    
    if (senderError || !sender) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }
    
    // 5. Send message
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: sender.id,
        receiver_id: receiverId,
        content,
        status: 'SENT'
      })
    
    if (error) {
      console.error('Send message error:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }
    
    // 6. Return success response
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
