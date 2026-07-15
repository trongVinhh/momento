// ─── Supabase Database Types ───────────────────────────────────────────────

export interface DestinationRow {
  id: string
  created_at: string
  name: string
  description: string | null
  country: string
  image_url: string
  user_id: string
  moments_count?: number // Computed via join / count query
}

export interface MomentRow {
  id: string
  created_at: string
  title: string
  description: string | null
  location: string
  destination_id: string
  image_url: string
  likes: number
  date: string
  user_id: string
}

// ─── Feed & Profile (tạm thời static, sẽ động hóa sau) ────────────────────

export interface FeedPost {
  id: string
  user: string
  avatar: string
  location: string
  image: string
  caption: string
  likes: number
  comments: number
  time: string
}

export const FEED_POSTS: FeedPost[] = [
  {
    id: '1',
    user: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    location: 'Shibuya Crossing, Tokyo',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
    caption: 'Chạm vào nhịp đập Tokyo lúc nửa đêm! 🌌 Đèn neon và dòng người hối hả tạo nên năng lượng cực đỉnh.',
    likes: 124,
    comments: 18,
    time: '2 giờ trước',
  },
  {
    id: '2',
    user: 'Minho Kim',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    location: 'Bukchon Hanok Village, Seoul',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
    caption: 'Một chút cổ kính bình yên giữa lòng Seoul nhộn nhịp. 🍁 Cảm giác đi giữa những ngôi nhà cổ thật đặc biệt.',
    likes: 98,
    comments: 12,
    time: '5 giờ trước',
  },
]

export const USER_STATS = [
  { label: 'Destinations', value: '0' },
  { label: 'Moments', value: '0' },
  { label: 'Followers', value: '0' },
]

export const MY_MOMENTS: string[] = []

export const POPULAR_COUNTRIES = [
  'Việt Nam',
  'Nhật Bản',
  'Hàn Quốc',
  'Thái Lan',
  'Singapore',
  'Indonesia',
  'Ý',
  'Pháp',
  'Mỹ',
  'Úc',
  'Anh',
  'Trung Quốc',
  'Đài Loan',
  'Malaysia',
  'Đức',
  'Tây Ban Nha'
]
