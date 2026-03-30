import { NextResponse } from 'next/server';
import { calculateMatchesForUser, AnswerVector } from '@/lib/matching-algorithm';

// Replace with your actual database client logic (e.g. Supabase Server Client)
// import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // 1. Verify this request actually came from Supabase (Security)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Parse the payload sent by Supabase when a new row is inserted into questionnaire_responses
    const body = await req.json();
    const newResponse = body.record; // The new row in questionnaire_responses

    if (!newResponse || !newResponse.user_id || !newResponse.answers) {
      return new NextResponse('Invalid Payload', { status: 400 });
    }

    const newUser = {
      userId: newResponse.user_id,
      answers: newResponse.answers as AnswerVector
    };

    /**
     * 3. IN PRODUCTION: Fetch all other active users from the database here
     * 
     * const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
     * const { data: allUsers } = await supabase
     *    .from('questionnaire_responses')
     *    .select('user_id, answers');
     */
    
    // MOCK DATA for structure:
    const allActiveUsers: { userId: string; answers: AnswerVector }[] = [
       // ... fetched data from above
    ];

    // 4. Run the 500-line math algorithm!
    const matches = calculateMatchesForUser(newUser, allActiveUsers);

    // 5. Build the array of match rows to insert
    const insertPayload = matches.map(match => ({
      user_a_id: newUser.userId,
      user_b_id: match.userId,
      match_percentage: match.result.matchPercentage,
      raw_score: match.result.rawScore,
      cross_category_flags: match.result.patternFlags,
      consistency_modifier: match.result.consistencyModifier,
    }));

    /**
     * 6. IN PRODUCTION: Insert them securely back into Supabase
     * 
     * if (insertPayload.length > 0) {
     *   await supabase.from('matches').insert(insertPayload);
     * }
     */

    return NextResponse.json({ 
      success: true, 
      matchesFound: matches.length 
    });

  } catch (error) {
    console.error('Match Calculation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
