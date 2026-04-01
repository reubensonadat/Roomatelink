// Roommate Link — Complete 40-Question Matching Algorithm Bank
// Source: apparchitecture.md Section 5.3 — The 40 Core Questions
// All question IDs, categories, weights, and answer options are LOCKED to the architecture spec.

export type AnswerOption = {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
};

export type Question = {
  id: string;
  category: string;
  categoryIndex: number; // 1-10
  weight: number;        // x1, x3, or x5
  question: string;
  options: AnswerOption[];
};

export const questions: Question[] = [
  // ─────────────────────────────────────────────────
  // Category 1: Conflict Style (Q1–Q4) | Weight x5
  // ─────────────────────────────────────────────────
  {
    id: "q1", category: "Conflict Style", categoryIndex: 1, weight: 5,
    question: "Your roommate comes back late every night and the door noise wakes you up. It has happened five times already. You have not said anything. What do you do?",
    options: [
      { id: "A", text: "I tell them directly it is disturbing my sleep and ask them to be more careful." },
      { id: "B", text: "I drop hints hoping they notice without me having to say it directly." },
      { id: "C", text: "I am silently annoyed but say nothing to avoid creating conflict." },
      { id: "D", text: "It genuinely would not bother me enough to think about." }
    ]
  },
  {
    id: "q2", category: "Conflict Style", categoryIndex: 1, weight: 5,
    question: "You told your roommate something personal in confidence. Later you overhear them telling another person exactly what you said. How do you handle it?",
    options: [
      { id: "A", text: "I confront them immediately and directly. That is a serious betrayal." },
      { id: "B", text: "I become cold and distant but never bring it up directly." },
      { id: "C", text: "I address it later when I have calmed down and can speak without anger." },
      { id: "D", text: "I let it go. I probably should not have shared it in the first place." }
    ]
  },
  {
    id: "q3", category: "Conflict Style", categoryIndex: 1, weight: 5,
    question: "You and your roommate had a serious argument yesterday. This morning they are acting completely normal like nothing happened. How does that make you feel?",
    options: [
      { id: "A", text: "Relieved. I hate tension. If they have moved on, so have I." },
      { id: "B", text: "Confused and frustrated. We never actually resolved anything." },
      { id: "C", text: "Uncomfortable. I need us to acknowledge what happened before I can move on." },
      { id: "D", text: "It depends on what the argument was about." }
    ]
  },
  {
    id: "q4", category: "Conflict Style", categoryIndex: 1, weight: 5,
    question: "You did something that genuinely upset your roommate. They confronted you about it calmly. What is your natural first reaction?",
    options: [
      { id: "A", text: "I apologise immediately and genuinely. If I was wrong I own it completely." },
      { id: "B", text: "I get defensive first, then apologise later when I have processed it." },
      { id: "C", text: "I apologise in the moment but internally I am still justifying my actions." },
      { id: "D", text: "I find it very hard to apologise even when I am wrong, because it makes me feel weak." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 2: Sleep & Study Schedule (Q5–Q8) | Weight x3
  // ─────────────────────────────────────────────────
  {
    id: "q5", category: "Sleep & Study Schedule", categoryIndex: 2, weight: 3,
    question: "It is 1AM on a Tuesday night. Where are you most likely?",
    options: [
      { id: "A", text: "Deep asleep. I sleep before midnight always." },
      { id: "B", text: "Just getting into my reading. Night is when my brain works best." },
      { id: "C", text: "Still awake but not studying. On my phone or watching something." },
      { id: "D", text: "It depends entirely on whether I have something due the next day." }
    ]
  },
  {
    id: "q6", category: "Sleep & Study Schedule", categoryIndex: 2, weight: 3,
    question: "Your roommate is asleep and you need to study. You think better with some background noise. What do you do?",
    options: [
      { id: "A", text: "I use earphones always. My noise is never my roommate's problem." },
      { id: "B", text: "I play something low. If they are really asleep they will not notice." },
      { id: "C", text: "I go somewhere else entirely — library, common room, anywhere but the room." },
      { id: "D", text: "I study in silence. My roommate's sleep matters more than my preference." }
    ]
  },
  {
    id: "q7", category: "Sleep & Study Schedule", categoryIndex: 2, weight: 3,
    question: "It is exam season. Your roommate studies by reading aloud, muttering to themselves and pacing the room. It helps them but affects your concentration. What happens?",
    options: [
      { id: "A", text: "We agree on a schedule — dedicated quiet hours and freedom hours." },
      { id: "B", text: "I put on earphones and adapt. Their space is their space too." },
      { id: "C", text: "I relocate. I would rather find somewhere else than create tension during exams." },
      { id: "D", text: "It would genuinely affect my results and I would struggle to hide my frustration." }
    ]
  },
  {
    id: "q8", category: "Sleep & Study Schedule", categoryIndex: 2, weight: 3,
    question: "Be honest. On a normal night with no exams and nothing due tomorrow — what time do you actually sleep?",
    options: [
      { id: "A", text: "Before 11PM. I need my full sleep no matter what." },
      { id: "B", text: "Between 11PM and 1AM. I am a natural night person but not extreme." },
      { id: "C", text: "After 1AM regularly. Night time is when I come alive." },
      { id: "D", text: "I have no consistent sleep time. It changes completely day to day." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 3: Cleanliness & Organisation (Q9–Q12) | Weight x3
  // ─────────────────────────────────────────────────
  {
    id: "q9", category: "Cleanliness & Organisation", categoryIndex: 3, weight: 3,
    question: "You just finished eating. There is a pile of dishes already in the sink from yesterday. What do you do?",
    options: [
      { id: "A", text: "I wash everything in the sink including my own. A clean sink is everyone's responsibility." },
      { id: "B", text: "I wash only my own dishes immediately. Mine are done, the rest is not my problem." },
      { id: "C", text: "I add mine to the pile. I will wash everything together when I have time." },
      { id: "D", text: "I don't mind a little mess when I'm busy. I usually just leave them and do one big wash every few days." }
    ]
  },
  {
    id: "q10", category: "Cleanliness & Organisation", categoryIndex: 3, weight: 3,
    question: "Your roommate's side of the room looks like a hurricane passed through it — clothes on the floor, books everywhere, food wraps on the desk. Their mess does not cross to your side. How do you feel?",
    options: [
      { id: "A", text: "Completely unbothered. Their side is their side. My side is my side." },
      { id: "B", text: "Mildly irritated but I say nothing. It is their space technically." },
      { id: "C", text: "It affects my peace even though it is not my side. I cannot relax in a messy environment." },
      { id: "D", text: "I would quietly start cleaning their side. I cannot help myself." }
    ]
  },
  {
    id: "q11", category: "Cleanliness & Organisation", categoryIndex: 3, weight: 3,
    question: "You have been busy all week. Your laundry is piling up. Your roommate mentions casually that the room is starting to smell. What is your honest reaction?",
    options: [
      { id: "A", text: "I appreciate it. That is exactly the kind of honesty I want from a roommate." },
      { id: "B", text: "Embarrassed but grateful they told me privately rather than ignoring it." },
      { id: "C", text: "Called out and slightly defensive, even though I know they are right." },
      { id: "D", text: "Disrespected. My laundry situation is my business, not theirs." }
    ]
  },
  {
    id: "q12", category: "Cleanliness & Organisation", categoryIndex: 3, weight: 3,
    question: "Be honest. When you move into a new room, how long before it looks like you have fully settled in?",
    options: [
      { id: "A", text: "Within the first day. Everything has a place and I put everything there immediately." },
      { id: "B", text: "Within the first week. I unpack gradually but I get there." },
      { id: "C", text: "Weeks. I live out of my bag longer than I should admit." },
      { id: "D", text: "I prefer convenience over extreme tidiness. I often live out of bags or leave things out where I can easily reach them." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 4: Social Habits (Q13–Q16) | Weight x3
  // ─────────────────────────────────────────────────
  {
    id: "q13", category: "Social Habits", categoryIndex: 4, weight: 3,
    question: "On a free Friday evening with no obligations, where are you most likely?",
    options: [
      { id: "A", text: "In the room relaxing. My room is my sanctuary and I recharge alone." },
      { id: "B", text: "Out with friends but back before midnight. I balance social and personal time." },
      { id: "C", text: "Out all evening and probably bringing people back to the room later." },
      { id: "D", text: "It completely depends on my mood. I am genuinely unpredictable." }
    ]
  },
  {
    id: "q14", category: "Social Habits", categoryIndex: 4, weight: 3,
    question: "Your roommate calls to say they are bringing three friends over in 30 minutes. You were tired and looking forward to a quiet evening. What do you do?",
    options: [
      { id: "A", text: "I say okay but I am privately frustrated. I put on earphones and endure it." },
      { id: "B", text: "I tell them honestly I am exhausted and ask if they can use the common room instead." },
      { id: "C", text: "I leave the room and give them their space. I will return when they are done." },
      { id: "D", text: "I join them. Company actually sounds better than being alone right now." }
    ]
  },
  {
    id: "q15", category: "Social Habits", categoryIndex: 4, weight: 3,
    question: "How often do you realistically have guests in your room on a typical week?",
    options: [
      { id: "A", text: "Rarely or never. My room is my private space. I meet people outside." },
      { id: "B", text: "Once or twice. Close friends occasionally but not regularly." },
      { id: "C", text: "Almost every day. My friends are always around and my room is the hangout spot." },
      { id: "D", text: "My significant other visits very regularly. That is mostly who comes." }
    ]
  },
  {
    id: "q16", category: "Social Habits", categoryIndex: 4, weight: 3,
    question: "Your roommate has friends over and they are being loud and laughing. It is 9PM — not unreasonably late. You have an 8AM class tomorrow. What do you do?",
    options: [
      { id: "A", text: "I join the conversation briefly then excuse myself and sleep through the noise." },
      { id: "B", text: "I let them know politely that I have an early class and ask them to keep it down." },
      { id: "C", text: "I say nothing but lie awake frustrated waiting for them to leave." },
      { id: "D", text: "I cannot sleep with noise and would seriously consider sleeping somewhere else." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 5: Roommate Relationship Expectation (Q17–Q20) | Weight x5
  // ─────────────────────────────────────────────────
  {
    id: "q17", category: "Roommate Relationship", categoryIndex: 5, weight: 5,
    question: "You and your roommate have lived together for one month. What does your ideal relationship with them look like at this point?",
    options: [
      { id: "A", text: "We greet each other warmly, respect each other's space, and that is enough for me." },
      { id: "B", text: "We have had real conversations, know basic things about each other, and check in occasionally." },
      { id: "C", text: "We are already becoming genuine friends. I want someone I can talk to about real things." },
      { id: "D", text: "I have not really thought about it. I just need someone reliable to share the space." }
    ]
  },
  {
    id: "q18", category: "Roommate Relationship", categoryIndex: 5, weight: 5,
    question: "After a long exhausting day where everything went wrong — bad lecture, missed assignment, argument with a friend — you come back to the room. What do you actually want from your roommate in that moment?",
    options: [
      { id: "A", text: "I want them to notice I am not okay and ask about it without me saying anything." },
      { id: "B", text: "I want them to give me complete space. I need silence to reset alone." },
      { id: "C", text: "I would bring it up myself if I wanted to talk. Otherwise I just want normal energy." },
      { id: "D", text: "I want the room to feel warm and comfortable but I do not need to talk about what happened." }
    ]
  },
  {
    id: "q19", category: "Roommate Relationship", categoryIndex: 5, weight: 5,
    question: "Your roommate comes back to the room while you are there. What does your ideal greeting look like on a normal everyday basis?",
    options: [
      { id: "A", text: "A genuine warm greeting, some small talk, checking in on each other's day briefly." },
      { id: "B", text: "A simple acknowledgment — hey, nod, smile. Warm but not conversation-starting." },
      { id: "C", text: "Nothing mandatory. If we feel like talking we talk. No expectation either way." },
      { id: "D", text: "I honestly prefer minimal interaction. I find constant daily greetings draining." }
    ]
  },
  {
    id: "q20", category: "Roommate Relationship", categoryIndex: 5, weight: 5,
    question: "Forget everything you wish you wanted. What are you actually looking for in a roommate relationship?",
    options: [
      { id: "A", text: "A genuine friendship. Someone I can laugh with, confide in and build memories with at university." },
      { id: "B", text: "A friendly acquaintance. Warm, respectful, easy to live with, but not necessarily a close friend." },
      { id: "C", text: "A reliable co-tenant. Someone who pays their share, respects the space, and stays out of my personal life." },
      { id: "D", text: "Honestly no preference. I adapt to whoever I am living with naturally." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 6: Lifestyle & Maturity (Q21–Q24) | Weight x1
  // ─────────────────────────────────────────────────
  {
    id: "q21", category: "Lifestyle & Maturity", categoryIndex: 6, weight: 1,
    question: "You are now living away from your parents for the first time. How does that honestly feel?",
    options: [
      { id: "A", text: "Liberating. I finally have freedom and I intend to fully enjoy it." },
      { id: "B", text: "Exciting but I am keeping the structure and discipline I had at home." },
      { id: "C", text: "A little overwhelming. I function better with some structure and accountability." },
      { id: "D", text: "Nothing has really changed. I was already quite independent before university." }
    ]
  },
  {
    id: "q22", category: "Lifestyle & Maturity", categoryIndex: 6, weight: 1,
    question: "It is a Wednesday night. No classes tomorrow. Someone invites you to a late night gathering that will probably go past midnight. What do you do?",
    options: [
      { id: "A", text: "I go without hesitation. Wednesday, Thursday, it does not matter. I am young and free." },
      { id: "B", text: "I go but set a personal limit. Home by 1AM and I stick to it." },
      { id: "C", text: "I probably decline. Weeknight late nights affect my entire next day badly." },
      { id: "D", text: "I would never do that during the week. My academic schedule is non-negotiable." }
    ]
  },
  {
    id: "q23", category: "Lifestyle & Maturity", categoryIndex: 6, weight: 1,
    question: "Your personal space, your academics, your social life — how would you honestly describe your self-discipline?",
    options: [
      { id: "A", text: "Very disciplined. I set rules for myself and follow them without needing reminders." },
      { id: "B", text: "Mostly disciplined, but I have moments where I completely fall off and need to reset." },
      { id: "C", text: "I struggle honestly. I work better under external pressure or accountability." },
      { id: "D", text: "I do not think about it much. I go with how I feel each day." }
    ]
  },
  {
    id: "q24", category: "Lifestyle & Maturity", categoryIndex: 6, weight: 1,
    question: "A close friend or sibling is describing you to a stranger. Which do you think they would most honestly say?",
    options: [
      { id: "A", text: "\"They are very serious and focused. Academics come first always with them.\"" },
      { id: "B", text: "\"They work hard but they know how to have fun. They balance it well.\"" },
      { id: "C", text: "\"They are the life of the party honestly. Very social, very fun, sometimes too much.\"" },
      { id: "D", text: "\"They are still figuring themselves out. University is changing them a lot right now.\"" }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 7: Lifestyle Imposition (Q25–Q28) | Weight x5
  // ─────────────────────────────────────────────────
  {
    id: "q25", category: "Lifestyle Imposition", categoryIndex: 7, weight: 5,
    question: "Your roommate comes back at 2AM on a Tuesday. The door noise wakes you accidentally. The next morning, what do you do?",
    options: [
      { id: "A", text: "Nothing. Their life is their business. I go back to sleep and forget it happened." },
      { id: "B", text: "I mention it casually and ask them to be more careful with the door." },
      { id: "C", text: "I ask them where they were coming from at that hour. I am genuinely concerned." },
      { id: "D", text: "I let them know that kind of schedule affects me and we need to discuss boundaries." }
    ]
  },
  {
    id: "q26", category: "Lifestyle Imposition", categoryIndex: 7, weight: 5,
    question: "Your roommate is visibly struggling academically. They are sleeping through classes, missing assignments, and spending more time on their phone than studying. It has nothing to do with your grades. What do you do?",
    options: [
      { id: "A", text: "Nothing. Their academics are entirely their responsibility, not mine." },
      { id: "B", text: "I mention it once genuinely as a friend, then leave it completely alone." },
      { id: "C", text: "I regularly check in and remind them about their responsibilities. I cannot watch silently." },
      { id: "D", text: "I would feel somehow responsible and find it very hard to mind my own business." }
    ]
  },
  {
    id: "q27", category: "Lifestyle Imposition", categoryIndex: 7, weight: 5,
    question: "Your roommate is very passionate about their beliefs and activities — religious, social, or otherwise. They regularly invite you to join them, and whenever you decline they always ask why. This happens consistently. How do you feel after two weeks?",
    options: [
      { id: "A", text: "Completely fine. They are sharing something they love. I decline politely and move on." },
      { id: "B", text: "Mildly tired of explaining myself but I understand they mean well so I manage." },
      { id: "C", text: "Genuinely exhausted and suffocated. I need my choices respected without explanation." },
      { id: "D", text: "I would have a direct conversation early. I respect your passion but please respect my boundaries." }
    ]
  },
  {
    id: "q28", category: "Lifestyle Imposition", categoryIndex: 7, weight: 5,
    question: "Be completely honest. When you see your roommate making a choice you personally disagree with — something that does not affect you at all — what is your natural instinct?",
    options: [
      { id: "A", text: "Nothing. Their choices are none of my business and I genuinely feel that way." },
      { id: "B", text: "I notice privately but would never say anything unsolicited." },
      { id: "C", text: "I would say something once if I genuinely cared. Just once." },
      { id: "D", text: "I care deeply about the people I live with, so I’d naturally want to offer guidance if I think they’re making a mistake." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 8: Romantic Life (Q29–Q32) | Weight x3
  // ─────────────────────────────────────────────────
  {
    id: "q29", category: "Romantic Life", categoryIndex: 8, weight: 3,
    question: "You are in a relationship. How often would your partner realistically visit your room?",
    options: [
      { id: "A", text: "Rarely or never. I keep my romantic life completely separate from my living space." },
      { id: "B", text: "Occasionally. Maybe once or twice a month for a few hours maximum." },
      { id: "C", text: "Regularly. My partner is part of my life and my room is part of my life." },
      { id: "D", text: "I am not in a relationship currently and I am not looking for one." }
    ]
  },
  {
    id: "q30", category: "Romantic Life", categoryIndex: 8, weight: 3,
    question: "It is 11PM. You are trying to sleep. Your roommate is on a phone call with their partner, speaking softly but audibly. This has happened three times this week. What do you do?",
    options: [
      { id: "A", text: "Nothing. Relationships need communication. I put earphones on and sleep." },
      { id: "B", text: "I mention it kindly once and ask if they can step outside for late night calls." },
      { id: "C", text: "I say nothing but I am getting more frustrated with each occurrence." },
      { id: "D", text: "Three times is already two too many. I would have addressed it after the first night." }
    ]
  },
  {
    id: "q31", category: "Romantic Life", categoryIndex: 8, weight: 3,
    question: "Your roommate's partner has visited three times this week. They are respectful and quiet but they are simply always there. How does that make you feel in your own room?",
    options: [
      { id: "A", text: "Completely fine. As long as they are respectful I have no problem with anyone being in the room." },
      { id: "B", text: "Mildly uncomfortable. I do not mind visits but I need my room to feel like my space sometimes." },
      { id: "C", text: "Very uncomfortable. I did not agree to live with two people. I need my room to feel like mine." },
      { id: "D", text: "It depends entirely on the person. Some energies I can tolerate, others I cannot." }
    ]
  },
  {
    id: "q32", category: "Romantic Life", categoryIndex: 8, weight: 3,
    question: "It is midnight. You are asleep. Your roommate receives a call from their partner and has an emotional argument — crying, raised voices — for 45 minutes. How do you handle it the next morning?",
    options: [
      { id: "A", text: "I check on them genuinely. Forget the sleep disruption. They were clearly going through something." },
      { id: "B", text: "I say nothing about the disruption but quietly check if they are okay." },
      { id: "C", text: "I address the disruption kindly but directly. I empathise, but it cannot happen regularly." },
      { id: "D", text: "I address it directly and firmly. Emotional situations do not exempt anyone from basic consideration." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 9: Food & Cooking (Q33–Q36) | Weight x1
  // ─────────────────────────────────────────────────
  {
    id: "q33", category: "Food & Cooking", categoryIndex: 9, weight: 1,
    question: "You cooked a meal and left it in the room while you went to lectures. You come back and your roommate has eaten a significant portion without asking. What is your reaction?",
    options: [
      { id: "A", text: "Genuinely unbothered. Food is food. We can sort it out." },
      { id: "B", text: "Annoyed but I mention it calmly once and establish a clear boundary going forward." },
      { id: "C", text: "Very upset. That is my food that I bought and cooked myself. That is unacceptable." },
      { id: "D", text: "I probably wouldn't make a big deal out of it, but I would definitely stop sharing my things with them." }
    ]
  },
  {
    id: "q34", category: "Food & Cooking", categoryIndex: 9, weight: 1,
    question: "How do you honestly handle food in a shared living situation?",
    options: [
      { id: "A", text: "I cook for myself only and expect everyone to do the same. My food is mine always." },
      { id: "B", text: "I do not mind occasional sharing but I need to be asked first. Always." },
      { id: "C", text: "I love cooking for others. If I cook I naturally make enough for my roommate too." },
      { id: "D", text: "I do not cook at all. I buy food outside and want zero food-related tension." }
    ]
  },
  {
    id: "q35", category: "Food & Cooking", categoryIndex: 9, weight: 1,
    question: "Your roommate finished your drinking water, used your cooking gas, or ate the last of something you bought for yourself. They did not replace it or mention it. How do you handle it?",
    options: [
      { id: "A", text: "I let it go. Small things are not worth tension." },
      { id: "B", text: "I mention it calmly once and ask them to replace it or tell me next time." },
      { id: "C", text: "I am genuinely upset. It is not about the item. It is about the disrespect of taking without asking." },
      { id: "D", text: "I start quietly hiding or locking my things. I protect my resources rather than confronting it." }
    ]
  },
  {
    id: "q36", category: "Food & Cooking", categoryIndex: 9, weight: 1,
    question: "Be completely honest. How do you feel about a roommate who asks you for food regularly — not stealing, just asking?",
    options: [
      { id: "A", text: "Completely fine. If I have it and they need it I will share without hesitation." },
      { id: "B", text: "Fine occasionally, but if it becomes a pattern it starts feeling uncomfortable." },
      { id: "C", text: "Honestly uncomfortable. I feel obligated to say yes even when I do not want to." },
      { id: "D", text: "I don't like it when people depend on me for food. If they do it regularly, honestly, I low-key lose respect for them." }
    ]
  },

  // ─────────────────────────────────────────────────
  // Category 10: Shared Resources & Borrowing (Q37–Q40) | Weight x1
  // ─────────────────────────────────────────────────
  {
    id: "q37", category: "Shared Resources", categoryIndex: 10, weight: 1,
    question: "Your roommate picks up your phone charger without asking while you are asleep. They return it before you wake up in perfect condition. How do you feel when you find out?",
    options: [
      { id: "A", text: "Completely fine. They needed it, returned it perfectly, no issue." },
      { id: "B", text: "Mildly uncomfortable. I prefer to be asked even for small things." },
      { id: "C", text: "Annoyed. The condition it was returned in is irrelevant. They should have asked." },
      { id: "D", text: "That is a violation of my personal space regardless of how small the item." }
    ]
  },
  {
    id: "q38", category: "Shared Resources", categoryIndex: 10, weight: 1,
    question: "Your roommate needs to iron their clothes urgently. You have an iron. You are out of the room. They use it and return it perfectly. You find out later. What do you do?",
    options: [
      { id: "A", text: "Nothing. That is exactly what shared living means to me." },
      { id: "B", text: "I mention it casually and ask them to text me next time even if I am not around." },
      { id: "C", text: "I am genuinely upset. The fact that they knew I was absent makes it worse, not better." },
      { id: "D", text: "I would have a serious conversation. My belongings always require explicit permission." }
    ]
  },
  {
    id: "q39", category: "Shared Resources", categoryIndex: 10, weight: 1,
    question: "Your roommate borrowed your extension cord three weeks ago. It is still on their side of the room. They have not mentioned returning it. Neither have you. How do you handle this?",
    options: [
      { id: "A", text: "I genuinely forgot about it. If I need it I will ask for it back casually." },
      { id: "B", text: "It has been bothering me quietly but I keep waiting for them to return it without me asking." },
      { id: "C", text: "I would have asked for it back after a few days. I track my belongings." },
      { id: "D", text: "I would never have lent it without setting a clear return expectation from the start." }
    ]
  },
  {
    id: "q40", category: "Shared Resources", categoryIndex: 10, weight: 1,
    question: "Forget everything you wish you were. Based on how you have actually lived and behaved in shared spaces before — with family, friends, anyone — what kind of roommate are you honestly?",
    options: [
      { id: "A", text: "Considerate and easygoing. I naturally think about how my actions affect those around me." },
      { id: "B", text: "Well-meaning but imperfect. I try hard but I have habits I know could irritate people." },
      { id: "C", text: "Quite particular. I have specific ways I like things and I struggle when those are disrupted." },
      { id: "D", text: "I am still figuring that out. I have never reflected on myself this way until right now." }
    ]
  }
];

export const TOTAL_QUESTIONS = 40;
