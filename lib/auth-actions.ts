'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { calculateMatch, encodeAnswers } from './matching-algorithm'

/**
 * SERVER ACTIONS — The Secure "Backend" for your Auth Buttons
 * 
 * These functions run on YOUR server, never in the student's browser.
 * That means passwords are never exposed to JavaScript in the browser.
 */

// Helper: gets the current site origin (e.g. http://localhost:3000 or https://roommatelink.com)
async function getOrigin() {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  return `${protocol}://${host}`
}

// Helper: creates a DIRECT admin Supabase client using the service role key
// This bypasses all Row Level Security and can delete auth users
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/dashboard')
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const origin = await getOrigin()
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // After clicking the email verification link, send them here
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: 'Check your email for a verification link!' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth')
}

export async function deleteAccount() {
  // Step 1: Get the current user's ID
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'You must be logged in to delete your account.' }
  }
  
  // Step 2: Use the ADMIN client (direct connection, not cookie-based)
  const adminClient = createAdminClient()
  
  // Step 2a: Explicitly delete the user's row from public.users first
  // (This also cascades to delete questionnaire_responses, matches, messages, reports)
  const { error: profileError } = await adminClient
    .from('users')
    .delete()
    .eq('auth_id', user.id)
  
  if (profileError) {
    console.error('Failed to delete profile:', profileError)
    return { error: 'Failed to delete your profile data. Please try again.' }
  }
  
  // Step 2b: Delete from auth.users (the login credentials)
  const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)
  
  if (authError) {
    console.error('Failed to delete auth user:', authError)
    return { error: 'Failed to delete your authentication. Please contact support.' }
  }
  
  // Step 3: Sign out the (now-deleted) user and send them to auth
  await supabase.auth.signOut()
  redirect('/auth')
}


export async function updateProfile(data: {
  fullName: string;
  phone: string;
  course: string;
  level: string;
  bio: string;
  avatarUrl: string;
  gender: string;
  matchPref: string;
  matchingStatus: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      phone_number: data.phone,
      course: data.course,
      level: parseInt(data.level),
      bio: data.bio,
      avatar_url: data.avatarUrl,
      gender: data.gender === 'M' ? 'MALE' : 'FEMALE',
      gender_pref: data.matchPref === 'same' ? 'SAME_GENDER' : 'ANY_GENDER',
      status: data.matchingStatus, // ACTIVE, HIDDEN, or COMPLETED
    })
    .eq('auth_id', user.id)

  return { success: true }
}

export async function generateMatches() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // 1. Get current student's ID and Answers
  const { data: currentUser } = await supabase
    .from('users')
    .select('id, gender, gender_pref')
    .eq('auth_id', user.id)
    .single()

  const { data: currentAnswers } = await supabase
    .from('questionnaire_responses')
    .select('answers')
    .eq('user_id', currentUser?.id)
    .single()

  if (!currentUser || !currentAnswers) {
    return { error: 'Profile or answers missing' }
  }

  // 2. Get all OTHER students who:
  //    - Have completed the questionnaire
  //    - Have PAID (or are Pioneers — both have has_paid=true)
  //    - Are ACTIVELY LOOKING (not paused, not found a roommate)
  //    - Match the gender preference filter
  let query = supabase
    .from('users')
    .select(`
      id,
      gender,
      gender_pref,
      questionnaire_responses(answers)
    `)
    .neq('id', currentUser.id)
    .not('questionnaire_responses', 'is', null)
    .eq('has_paid', true)
    .eq('status', 'ACTIVE')

  // Basic Gender Filtering (matching your logic)
  if (currentUser.gender_pref === 'SAME_GENDER') {
    query = query.eq('gender', currentUser.gender)
  }

  const { data: otherStudents, error: fetchError } = await query


  if (fetchError) {
    console.error('Fetch students error:', fetchError)
    return { error: 'Failed to fetch potentially compatible students' }
  }

  // 3. Process compatibility for each student
  const myAnswersNumeric = encodeAnswers(currentAnswers.answers as Record<string, string>)
  const matchResults = []

  for (const other of otherStudents) {
    // Only process if they have answers
    const otherAnsRaw = other.questionnaire_responses as any
    if (!otherAnsRaw || !otherAnsRaw[0]?.answers) continue

    const otherAnswersNumeric = encodeAnswers(otherAnsRaw[0].answers as Record<string, string>)
    const result = calculateMatch(myAnswersNumeric, otherAnswersNumeric)

    // Only save if highly compatible (above threshold)
    if (result.isVisible) {
      matchResults.push({
        user_a_id: currentUser.id,
        user_b_id: other.id,
        match_percentage: result.matchPercentage,
        raw_score: result.rawScore,
        adjusted_score: result.adjustedScore,
        total_penalty: result.totalPenalty,
        consistency_modifier: result.consistencyModifier,
        cross_category_flags: result.patternFlags,
        category_scores: result.categoryBreakdown.map(cat => ({
          name: cat.categoryName,
          score: Math.round(cat.weightedScore * 100 / cat.maxWeightedScore),
          insight: getInsightForCategory(cat.categoryName, Math.round(cat.weightedScore * 100 / cat.maxWeightedScore))
        })),
        calculated_at: new Date().toISOString()
      })
    }
  }

  // 4. Batch upsert the matches
  if (matchResults.length > 0) {
    const { error: matchError } = await supabase
      .from('matches')
      .upsert(matchResults, { onConflict: 'user_a_id, user_b_id' })

    if (matchError) {
      console.error('Match upsert error:', matchError)
      return { error: 'Failed to save compatibility scores' }
    }
  }

  return { success: true, count: matchResults.length }
}

/**
 * SEND MESSAGE
 * Persists a chat message to the database.
 */
export async function sendMessageAction(receiverId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: sender } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!sender) return { error: 'Profile not found' };

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: sender.id,
      receiver_id: receiverId,
      content,
      status: 'SENT'
    });

  if (error) {
    console.error('Send message error:', error);
    return { error: 'Failed to send message' };
  }

  return { success: true };
}

/**
 * CHECK PIONEER STATUS
 * Returns whether the current user qualifies for free Pioneer access.
 * A user is a Pioneer if the total number of registered users is < 100
 * AND they haven't already paid.
 */
export async function checkPioneerStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isPioneer: false, userCount: 0 };

  // Count total users in the platform
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const totalUsers = count ?? 0;
  const isPioneer = totalUsers < 100;

  return { isPioneer, userCount: totalUsers };
}

/**
 * CLAIM PIONEER ACCESS
 * Grants free Premium to a Pioneer user (first 100).
 * Sets has_paid=true and is_pioneer=true without going through Paystack.
 */
export async function claimPioneerAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Re-verify eligibility before granting (defense against abuse)
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) >= 100) {
    return { error: 'Pioneer slots are full. Please proceed with payment.' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      has_paid: true,
      is_pioneer: true,
      payment_date: new Date().toISOString(),
      payment_reference: 'PIONEER_FREE_ACCESS',
    })
    .eq('auth_id', user.id);

  if (error) {
    console.error('Claim pioneer access error:', error);
    return { error: 'Failed to claim Pioneer access. Try again.' };
  }

  return { success: true };
}
export async function saveQuestionnaireResponses(answers: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to save answers.' }
  }

  // 1. Get the public user's internal ID
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Failed to get student profile:', profileError)
    return { error: 'Student profile not found. Please complete profile setup first.' }
  }

  // 2. Save the the answers to questionnaire_responses
  const { error: saveError } = await supabase
    .from('questionnaire_responses')
    .upsert({
      user_id: profile.id,
      answers: answers,
      completed_at: new Date().toISOString()
    })

  if (saveError) {
    console.error('Save answers error:', saveError)
    return { error: 'Failed to save answers. Try again.' }
  }

  return { success: true }
}

/** 
 * HELPER: Simple insights based on category and score 
 */
function getInsightForCategory(name: string, score: number): string {
  if (score >= 90) return `Exceptional alignment in ${name.toLowerCase()}.`;
  if (score >= 75) return `Strong shared values regarding ${name.toLowerCase()}.`;
  if (score >= 60) return `Good common ground on ${name.toLowerCase()}.`;
  return `Potential for compromise in ${name.toLowerCase()}.`;
}

/**
 * SEND PASSWORD RESET
 * Triggers a real reset email via Supabase Auth
 */
export async function sendPasswordReset() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return { error: 'No email found for this account' };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * VERIFY UNIVERSITY EMAIL
 * Checks the user's current email domain against the university_domains table
 */
export async function verifyUniversityEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return { error: 'No email found' };

  const domain = user.email.split('@')[1];
  if (!domain) return { error: 'Invalid email format' };

  // Check against our whitelist table
  const { data: university, error: domainError } = await supabase
    .from('university_domains')
    .select('id, university_name')
    .eq('email_domain', domain)
    .single();

  if (domainError || !university) {
    return { error: `The domain @${domain} is not currently a recognized University domain on our platform.` };
  }

  // Domain matches! Update user profile
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      is_student_verified: true,
      university_id: university.id 
    })
    .eq('auth_id', user.id);

  if (updateError) return { error: 'Failed to update verification status' };

  return { success: true, university: university.university_name };
}
