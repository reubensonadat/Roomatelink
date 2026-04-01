import { supabase } from './supabase'

/**
 * VERIFY UNIVERSITY EMAIL (Client-side port)
 * Checks the provided email domain against the university_domains table.
 */
export async function verifyUniversityEmail(manualEmail?: string) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Use the manual email if provided, otherwise fallback to their login email
  const targetEmail = manualEmail || user.email
  if (!targetEmail) throw new Error('No email found to verify')

  const domain = targetEmail.split('@')[1]
  if (!domain) throw new Error('Invalid email format')

  // Check against our whitelist table
  const { data: university, error: domainError } = await supabase
    .from('university_domains')
    .select('id, university_name')
    .eq('email_domain', domain)
    .single()

  if (domainError || !university) {
    throw new Error(`The domain @${domain} is not a recognized University domain on our platform.`)
  }

  // Domain matches! Update user profile
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      is_student_verified: true,
      student_email: targetEmail,
      university_id: university.id 
    })
    .eq('auth_id', user.id)

  if (updateError) throw new Error('Failed to update verification status')

  return { success: true, university: university.university_name }
}
