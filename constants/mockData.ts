export interface Destination {
  name: string
  moments: number
  image: string
  description: string
  momentsList: Array<{
    id: string
    title: string
    date: string
    image: string
    likes: number
    location: string
  }>
}

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

export const DESTINATIONS: Record<string, Destination> = {
  tokyo: {
    name: 'Tokyo',
    moments: 23,
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101902_e8f0f37b-18b7-4c14-bb5c-99f0724d2646.png&w=1280&q=85',
    description: 'Nơi giao thoa hoàn hảo giữa công nghệ tương lai và đền đài cổ kính.',
    momentsList: [
      {
        id: 't1',
        title: 'Bình minh rực rỡ tại đền Senso-ji',
        date: '12/10/2025',
        image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
        likes: 45,
        location: 'Asakusa, Tokyo',
      },
      {
        id: 't2',
        title: 'Ánh đèn neon ảo diệu ở khu Shibuya',
        date: '14/10/2025',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80',
        likes: 67,
        location: 'Shibuya Crossing',
      },
    ],
  },
  seoul: {
    name: 'Seoul',
    moments: 18,
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101935_4b17f250-8ddb-4ff2-b63d-dfd3497d4428.png&w=1280&q=85',
    description: 'Thủ đô sôi động ngập tràn văn hóa Hanbok và những ngõ hẻm Hanok cổ xưa.',
    momentsList: [
      {
        id: 's1',
        title: 'Thu vàng lãng mạn tại đảo Nami',
        date: '20/11/2025',
        image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80',
        likes: 38,
        location: 'Nami Island, Seoul',
      },
    ],
  },
  bali: {
    name: 'Bali',
    moments: 29,
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101958_7116d6bf-fd6f-496f-b3cf-007688cd5123.png&w=1280&q=85',
    description: 'Hòn đảo thiên đường của sóng biển, những thửa ruộng bậc thang và đền thờ tâm linh.',
    momentsList: [
      {
        id: 'b1',
        title: 'Hoàng hôn đỏ rực tại đền Tanah Lot',
        date: '05/01/2026',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
        likes: 84,
        location: 'Tanah Lot, Bali',
      },
    ],
  },
  rome: {
    name: 'Rome',
    moments: 15,
    image:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_143008_72ee7299-04a8-474c-ae73-220d45b24a20.png&w=1280&q=85',
    description: 'Thành phố vĩnh hằng lưu giữ tàn tích đế chế La Mã tráng lệ.',
    momentsList: [
      {
        id: 'r1',
        title: 'Khám phá Đấu trường cổ Colosseum',
        date: '15/03/2026',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
        likes: 92,
        location: 'Colosseum, Rome',
      },
    ],
  },
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
  { label: 'Destinations', value: '4' },
  { label: 'Moments', value: '85' },
  { label: 'Followers', value: '1.2K' },
]

export const MY_MOMENTS = [
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101902_e8f0f37b-18b7-4c14-bb5c-99f0724d2646.png&w=400&q=80',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101935_4b17f250-8ddb-4ff2-b63d-dfd3497d4428.png&w=400&q=80',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_101958_7116d6bf-fd6f-496f-b3cf-007688cd5123.png&w=400&q=80',
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260704_143008_72ee7299-04a8-474c-ae73-220d45b24a20.png&w=400&q=80',
]
