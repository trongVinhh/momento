import { MessageSquare, Globe, HelpCircle, BookOpen } from 'lucide-react-native'

export const SCENARIOS = [
  {
    id: 'free',
    titleVi: 'Hội thoại tự do',
    titleEn: 'Free Talk',
    prompt: 'Free conversation. Be a friendly language exchange partner. Keep answers natural and short (1-2 sentences).',
    icon: MessageSquare,
  },
  {
    id: 'izakaya',
    titleVi: 'Gọi món tại Izakaya',
    titleEn: 'Ordering at Izakaya',
    prompt: 'You are a lively staff member at a busy Japanese Izakaya restaurant. Guide the user in ordering drinks and food. Use standard polite Japanese (Desu/Masu) but sound energetic.',
    icon: BookOpen,
  },
  {
    id: 'job_interview',
    titleVi: 'Phỏng vấn xin việc',
    titleEn: 'Job Interview',
    prompt: 'You are an interviewer at a convenience store hiring a part-time clerk. Ask formal interview questions about their experience, schedule, and motivation. Speak politely and clearly.',
    icon: HelpCircle,
  },
  {
    id: 'asking_directions',
    titleVi: 'Hỏi đường ở nhà ga',
    titleEn: 'Asking for Directions',
    prompt: 'You are a helpful local resident at a Japanese train station. Help the user find their way to a nearby tourist spot. Speak clearly and politely.',
    icon: Globe,
  },
]

export const LANGUAGES = [
  { code: 'Japanese', name: 'Nhật', flag: '🇯🇵' },
  { code: 'English', name: 'Anh', flag: '🇺🇸' },
  { code: 'Korean', name: 'Hàn', flag: '🇰🇷' },
  { code: 'Chinese', name: 'Trung', flag: '🇨🇳' },
]
