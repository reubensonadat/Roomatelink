import { AnswerVector } from "./matching-algorithm";

export interface SeedUser {
  userId: string;
  name: string;
  answers: AnswerVector;
}

/**
 * MOCK DATABASE PROFILES
 * Used specifically to verify the Matching Algorithm's mathematical accuracy
 * before deploying the Next.js Webhook to production.
 */
export const SEED_USERS: SeedUser[] = [
  {
    userId: "user_messy_unapologetic",
    name: "Kwasi (The Messy Nightmare)",
    // Creates the MESSY_UNAPOLOGETIC penalty (Q11=4, Q4=4)
    answers: {
      q1: 1, q2: 2, q3: 3, q4: 4, // Q4=4 (Defensive when confronted)
      q5: 1, q6: 2, q7: 3, q8: 4,
      q9: 1, q10: 2, q11: 4, q12: 4, // Q11=4 (Leaves mess for days)
      q13: 1, q14: 2, q15: 3, q16: 4,
      q17: 1, q18: 2, q19: 3, q20: 4,
      q21: 1, q22: 2, q23: 3, q24: 4,
      q25: 1, q26: 2, q27: 3, q28: 4,
      q29: 1, q30: 2, q31: 3, q32: 4,
      q33: 1, q34: 2, q35: 3, q36: 4,
      q37: 1, q38: 2, q39: 3, q40: 4,
    }
  },
  {
    userId: "user_clean_freak",
    name: "Ama (The Clean Perfectionist)",
    // Opposite of Kwasi. Clean (Q9=1, Q11=1) and communicative (Q4=1).
    answers: {
      q1: 1, q2: 1, q3: 1, q4: 1, 
      q5: 1, q6: 1, q7: 1, q8: 1,
      q9: 1, q10: 1, q11: 1, q12: 1, 
      q13: 1, q14: 1, q15: 1, q16: 1,
      q17: 1, q18: 1, q19: 1, q20: 1,
      q21: 1, q22: 1, q23: 1, q24: 1,
      q25: 1, q26: 1, q27: 1, q28: 1,
      q29: 1, q30: 1, q31: 1, q32: 1,
      q33: 1, q34: 1, q35: 1, q36: 1,
      q37: 1, q38: 1, q39: 1, q40: 1,
    }
  },
  {
    userId: "user_dual_imposer",
    name: "Kofi (The Moral Imposer)",
    // Creates the DUAL_IMPOSER penalty if matched with someone similar (Q28=4, Q26=3)
    answers: {
      q1: 2, q2: 2, q3: 2, q4: 2,
      q5: 2, q6: 2, q7: 2, q8: 2,
      q9: 2, q10: 2, q11: 2, q12: 2,
      q13: 2, q14: 2, q15: 2, q16: 2,
      q17: 2, q18: 2, q19: 2, q20: 2,
      q21: 2, q22: 2, q23: 2, q24: 2,
      q25: 2, q26: 3, q27: 2, q28: 4, // Imposer stats
      q29: 2, q30: 2, q31: 2, q32: 2,
      q33: 2, q34: 2, q35: 2, q36: 2,
      q37: 2, q38: 2, q39: 2, q40: 2,
    }
  },
  {
    userId: "user_average",
    name: "Yaw (The Balanced Guy)",
    // A standard mix of mostly B and C answers
    answers: {
      q1: 2, q2: 3, q3: 2, q4: 3,
      q5: 2, q6: 3, q7: 2, q8: 3,
      q9: 2, q10: 3, q11: 2, q12: 3,
      q13: 2, q14: 3, q15: 2, q16: 3,
      q17: 2, q18: 3, q19: 2, q20: 3,
      q21: 2, q22: 3, q23: 2, q24: 3,
      q25: 2, q26: 3, q27: 2, q28: 3,
      q29: 2, q30: 3, q31: 2, q32: 3,
      q33: 2, q34: 3, q35: 2, q36: 3,
      q37: 2, q38: 3, q39: 2, q40: 3,
    }
  }
];
