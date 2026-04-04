import { encodeAnswers, calculateMatchesForUser } from './supabase/functions/match-calculate/judge.ts';

const userA_answers = {"q1": "A", "q2": "C", "q3": "C", "q4": "A", "q5": "A", "q6": "A", "q7": "C", "q8": "A", "q9": "A", "q10": "B", "q11": "A", "q12": "B", "q13": "A", "q14": "B", "q15": "B", "q16": "B", "q17": "A", "q18": "C", "q19": "B", "q20": "A", "q21": "B", "q22": "D", "q23": "B", "q24": "B", "q25": "A", "q26": "B", "q27": "B", "q28": "B", "q29": "D", "q30": "D", "q31": "B", "q32": "B", "q33": "C", "q34": "B", "q35": "C", "q36": "B", "q37": "A", "q38": "B", "q39": "C", "q40": "B"};

const userB_answers = {"q1": "D", "q2": "B", "q3": "D", "q4": "A", "q5": "D", "q6": "A", "q7": "B", "q8": "B", "q9": "A", "q10": "A", "q11": "B", "q12": "A", "q13": "A", "q14": "A", "q15": "A", "q16": "B", "q17": "A", "q18": "C", "q19": "B", "q20": "B", "q21": "D", "q22": "B", "q23": "B", "q24": "A", "q25": "A", "q26": "B", "q27": "B", "q28": "C", "q29": "B", "q30": "A", "q31": "B", "q32": "B", "q33": "C", "q34": "A", "q35": "B", "q36": "B", "q37": "A", "q38": "A", "q39": "A", "q40": "A"};

const encodedA = encodeAnswers(userA_answers);
const candidates = [
  { userId: 'friend-id', answers: encodeAnswers(userB_answers) }
];

const matches = calculateMatchesForUser('test-id', encodedA, candidates);
console.log(JSON.stringify(matches, null, 2));
