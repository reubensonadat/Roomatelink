import { Flame, ShieldCheck, Sparkles, UserCheck, Heart } from 'lucide-react'

export interface MockMatch {
  id: string
  name: string
  verified: boolean
  matchPercent: number
  gender: 'Male' | 'Female' | 'Other'
  course: string
  level: string
  avatar: string
  bio: string
  trait: string
  lifestyle: { icon: any; text: string }[]
  tags: string[]
  sharedTraits: string[]
  tensions: string[]
  categoryScores: { name: string; score: number; insight: string }[]
}

export const MOCK_MATCHES: MockMatch[] = [
  {
    id: 'mock-1',
    name: 'Sarah Thompson',
    verified: true,
    matchPercent: 98,
    gender: 'Female',
    course: 'Architecture',
    level: '300 Level',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Dedicated architecture student at the Main Campus. I value a serene, high-aesthetic environment for my design projects. When I\'m not in the studio, I enjoy fine-tuning my space and brewing premium coffee. Looking for a roommate who respects deep-work hours.',
    trait: 'Institutional Grade',
    lifestyle: [
      { icon: Sparkles, text: 'Ultra-Sanitized' },
      { icon: Heart, text: 'Morning Routine' },
      { icon: ShieldCheck, text: 'Deep Work Mode' }
    ],
    tags: ['Architecture', 'Main Campus', 'Studio Life', 'Minimalist'],
    sharedTraits: ['Sanitation Standards', 'Academic Rigor', 'Nocturnal Design Cycles'],
    tensions: ['Studio Project Deadlines', 'Strict Guest Policy'],
    categoryScores: [
      { name: 'Sanitation', score: 99, insight: 'Both maintain a showroom-quality living space.' },
      { name: 'Social Pulse', score: 96, insight: 'Values individual boundaries and intellectual quietude.' },
      { name: 'Vibe Sync', score: 94, insight: 'Shared appreciation for minimalist aesthetics and routine.' }
    ]
  },
  {
    id: 'mock-2',
    name: 'James Kalu',
    verified: true,
    matchPercent: 88,
    gender: 'Male',
    course: 'Computer Science',
    level: '400 Level',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'CS final year. Introverted but friendly. I spend most of my time coding or reading. Very chill environment.',
    trait: 'Quiet Focused',
    lifestyle: [
      { icon: ShieldCheck, text: 'Study First' },
      { icon: Flame, text: 'Night Owl' },
      { icon: UserCheck, text: 'Minimalist' }
    ],
    tags: ['Tech', 'Gaming', 'Reading'],
    sharedTraits: ['Academic Focus', 'Noise Tolerance'],
    tensions: ['Sleep Schedule (Night Owl)'],
    categoryScores: [
      { name: 'Cleanliness', score: 85, insight: 'Both maintain a tidy workspace.' },
      { name: 'Social Sync', score: 95, insight: 'High respect for individual boundaries.' },
      { name: 'Lifestyle', score: 75, insight: 'Slight difference in nocturnal activity.' }
    ]
  },
  {
    id: 'mock-3',
    name: 'Amina Bello',
    verified: true,
    matchPercent: 82,
    gender: 'Female',
    course: 'Economics',
    level: '200 Level',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=400&fit=crop',
    bio: 'Social butterfly but knows when to buckle down. I love music and trying out new recipes!',
    trait: 'Active Social',
    lifestyle: [
      { icon: Heart, text: 'Outgoing' },
      { icon: Sparkles, text: 'Chef Mode' },
      { icon: Flame, text: 'Energetic' }
    ],
    tags: ['Music', 'Foodie', 'Economics'],
    sharedTraits: ['Creative Energy', 'Culinary Interest'],
    tensions: ['Social Frequency'],
    categoryScores: [
      { name: 'Cleanliness', score: 80, insight: 'Good common area maintenance.' },
      { name: 'Social Sync', score: 70, insight: 'Higher social activity than your average.' },
      { name: 'Lifestyle', score: 90, insight: 'Very flexible and accommodating.' }
    ]
  },
  {
    id: 'mock-4',
    name: 'Chidi Okafor',
    verified: false,
    matchPercent: 74,
    gender: 'Male',
    course: 'Mechanical Engineering',
    level: '500 Level',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Finalist engineering student. Practical, straightforward, and works a part-time job. Rarely home during the day.',
    trait: 'Hard Worker',
    lifestyle: [
      { icon: ShieldCheck, text: 'Reliable' },
      { icon: UserCheck, text: 'Independent' },
      { icon: Heart, text: 'Mature' }
    ],
    tags: ['Engineering', 'Gym', 'Work'],
    sharedTraits: ['Discipline', 'Responsibility'],
    tensions: ['Communication Style'],
    categoryScores: [
      { name: 'Cleanliness', score: 88, insight: 'Very disciplined with chores.' },
      { name: 'Social Sync', score: 85, insight: 'Minimal interference with your routine.' },
      { name: 'Lifestyle', score: 65, insight: 'Very busy schedule might limit interaction.' }
    ]
  }
]
