import { type Category } from './companies'
import { type User } from '../auth/auth'

export interface UserProfileData {
  fullName: string
  phone: string
  professionalTitle: string
  profilePhoto: string
  shortBio: string
  professionalExperience: string
  education: string
  achievements: string[]
  city: string
  country: string
  website: string
  socialMedia: string
  digitalSlug: string
}

export interface UserBusinessData {
  id: string
  companyLogo: string
  coverImage: string
  companyName: string
  industry: string
  description: string
  founderLeadership: string
  city: string
  country: string
  website: string
  phone: string
  email: string
  status: 'Published' | 'Pending review'
}

export interface UserArticleData {
  id: string
  featuredImage: string
  title: string
  topic: string
  excerpt: string
  author: string
  publishedDate: string
  status: 'Published' | 'Draft'
  visibility: 'Public' | 'Members only'
}

export interface UserEventData {
  id: string
  eventImage: string
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  location: string
  online: boolean
  eventUrl: string
  status: 'Published' | 'Draft'
}

export interface UserDashboardData {
  profile: UserProfileData
  businesses: UserBusinessData[]
  articles: UserArticleData[]
  blogs: UserArticleData[]
  events: UserEventData[]
}

export type UserContentType = 'businesses' | 'articles' | 'blogs' | 'events'

type UserContentItem = UserBusinessData | UserArticleData | UserEventData

const DASHBOARD_DATA_KEY = 'kbn_user_dashboard_data'

const DEMO_DASHBOARD_DATA: Record<string, Omit<UserDashboardData, 'profile'>> = {
  'abel@example.com': {
    businesses: [
      { id: 'abel-business-1', companyLogo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=160&h=160&fit=crop&auto=format', coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=420&fit=crop&auto=format', companyName: 'Selam Build Collective', industry: 'Construction', description: 'A purpose-led construction studio creating durable homes, schools, and community spaces across Addis Ababa.', founderLeadership: 'Founded and led by Abel Tesfaye', city: 'Addis Ababa', country: 'Ethiopia', website: 'selambuild.et', phone: '+251 911 246 810', email: 'hello@selambuild.et', status: 'Published' },
      { id: 'abel-business-2', companyLogo: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=160&h=160&fit=crop&auto=format', coverImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&h=420&fit=crop&auto=format', companyName: 'Covenant Works Advisory', industry: 'Professional Services', description: 'Business planning and operations guidance for growing teams that want to lead with integrity.', founderLeadership: 'Abel Tesfaye, Managing Partner', city: 'Addis Ababa', country: 'Ethiopia', website: 'covenantworks.et', phone: '+251 912 883 420', email: 'connect@covenantworks.et', status: 'Pending review' },
    ],
    articles: [
      { id: 'abel-article-1', featuredImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=520&fit=crop&auto=format', title: 'Building Businesses That Serve Their Communities', topic: 'Leadership', excerpt: 'Three practical ways purpose-driven founders can turn everyday decisions into lasting community impact.', author: 'Abel Tesfaye', publishedDate: 'August 18, 2025', status: 'Published', visibility: 'Public' },
      { id: 'abel-article-2', featuredImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&h=520&fit=crop&auto=format', title: 'A Better Rhythm for Sustainable Growth', topic: 'Business growth', excerpt: 'A simple planning rhythm for leaders balancing excellence, people, and long-term stewardship.', author: 'Abel Tesfaye', publishedDate: 'September 2, 2025', status: 'Draft', visibility: 'Members only' },
    ],
    blogs: [
      { id: 'abel-blog-1', featuredImage: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=900&h=520&fit=crop&auto=format', title: 'Notes from a Builder in Addis', topic: 'Community story', excerpt: 'A reflection on the people and small acts of faithfulness behind a new neighborhood project.', author: 'Abel Tesfaye', publishedDate: 'July 29, 2025', status: 'Published', visibility: 'Public' },
    ],
    events: [
      { id: 'abel-event-1', eventImage: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=900&h=520&fit=crop&auto=format', title: 'Purpose-Driven Business Breakfast', description: 'A morning conversation for founders about building excellent businesses without losing sight of people.', eventType: 'Networking', startDate: 'October 18, 2025 at 8:30 AM', endDate: 'October 18, 2025 at 11:00 AM', location: 'Selam Build Studio, Addis Ababa', online: false, eventUrl: 'kbn.org/events/business-breakfast', status: 'Published' },
      { id: 'abel-event-2', eventImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&h=520&fit=crop&auto=format', title: 'Founders Prayer Room', description: 'A quiet online gathering to pray for our work, teams, families, and the city we serve.', eventType: 'Prayer gathering', startDate: 'November 6, 2025 at 7:00 PM', endDate: 'November 6, 2025 at 8:00 PM', location: 'Online via Zoom', online: true, eventUrl: 'kbn.org/events/founders-prayer-room', status: 'Published' },
    ],
  },
  'tigist@example.com': {
    businesses: [
      { id: 'tigist-business-1', companyLogo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=160&h=160&fit=crop&auto=format', coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=420&fit=crop&auto=format', companyName: 'Mekdes Textile House', industry: 'Fashion', description: 'Contemporary Ethiopian apparel made with thoughtful design, local craft, and confident everyday style.', founderLeadership: 'Founded and led by Tigist Lemma', city: 'Addis Ababa', country: 'Ethiopia', website: 'mekdestextile.et', phone: '+251 913 553 204', email: 'hello@mekdestextile.et', status: 'Published' },
      { id: 'tigist-business-2', companyLogo: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=160&h=160&fit=crop&auto=format', coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=420&fit=crop&auto=format', companyName: 'Grace & Grain Market', industry: 'Food & Beverage', description: 'A neighborhood market connecting families with local produce, warm hospitality, and ethical suppliers.', founderLeadership: 'Tigist Lemma, Founder', city: 'Bole, Addis Ababa', country: 'Ethiopia', website: 'gracegrain.et', phone: '+251 914 108 672', email: 'hello@gracegrain.et', status: 'Published' },
    ],
    articles: [
      { id: 'tigist-article-1', featuredImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=520&fit=crop&auto=format', title: 'The Courage to Create with Excellence', topic: 'Creativity', excerpt: 'What it looks like to honor craft, customers, and calling while growing a creative business.', author: 'Tigist Lemma', publishedDate: 'August 8, 2025', status: 'Published', visibility: 'Public' },
    ],
    blogs: [
      { id: 'tigist-blog-1', featuredImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=520&fit=crop&auto=format', title: 'Why Local Stories Matter', topic: 'Culture and work', excerpt: 'A personal note about celebrating local makers and creating room for their stories to be heard.', author: 'Tigist Lemma', publishedDate: 'September 12, 2025', status: 'Published', visibility: 'Members only' },
    ],
    events: [
      { id: 'tigist-event-1', eventImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900&h=520&fit=crop&auto=format', title: 'Women in Enterprise Circle', description: 'An intimate evening for women founders to share lessons, encouragement, and practical connections.', eventType: 'Community gathering', startDate: 'October 25, 2025 at 5:30 PM', endDate: 'October 25, 2025 at 8:00 PM', location: 'Mekdes Textile House, Addis Ababa', online: false, eventUrl: 'kbn.org/events/women-enterprise-circle', status: 'Published' },
      { id: 'tigist-event-2', eventImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&h=520&fit=crop&auto=format', title: 'Creative Business Workshop', description: 'A practical workshop on brand clarity, customer care, and creating a business people remember.', eventType: 'Workshop', startDate: 'November 15, 2025 at 10:00 AM', endDate: 'November 15, 2025 at 1:00 PM', location: 'Grace & Grain Market, Bole', online: false, eventUrl: 'kbn.org/events/creative-business-workshop', status: 'Draft' },
    ],
  },
}

export function getUserDashboardData(email: string, user: User): UserDashboardData {
  const demo = DEMO_DASHBOARD_DATA[email.toLowerCase()]
  const stored = readStoredDashboardData(email)
  return {
    profile: stored?.profile ?? (demo ? {
      fullName: user.name,
      phone: email.startsWith('abel') ? '+251 911 246 810' : '+251 913 553 204',
      professionalTitle: email.startsWith('abel') ? 'Builder and Community Leader' : 'Founder and Creative Director',
      profilePhoto: user.avatar,
      shortBio: email.startsWith('abel') ? 'I help build practical spaces and purposeful businesses that strengthen families and communities.' : 'I create thoughtful products and spaces that celebrate Ethiopian creativity and help people flourish.',
      professionalExperience: email.startsWith('abel') ? '12 years in construction, operations, and social enterprise leadership.' : '9 years in fashion, retail, and creative business development.',
      education: email.startsWith('abel') ? 'BSc in Construction Management, Addis Ababa University' : 'BA in Fashion Design, Ethiopian Institute of Technology.',
      achievements: email.startsWith('abel') ? ['Built 18 community spaces', 'KBN Community Impact Award 2024', 'Mentor, Young Builders Fellowship'] : ['Launched 2 local brands', 'Ethiopian Design Week speaker', 'Mentor, Women in Enterprise Circle'],
      city: 'Addis Ababa', country: 'Ethiopia', website: email.startsWith('abel') ? 'abeltesfaye.et' : 'tigistlemma.et', socialMedia: email.startsWith('abel') ? '@abelbuilds' : '@tigistcreates', digitalSlug: email.startsWith('abel') ? 'abel-tesfaye' : 'tigist-lemma',
    } : {
      fullName: user.name, phone: 'Not provided', professionalTitle: 'Community Member', profilePhoto: user.avatar, shortBio: 'A member of the Kingdom Builders Network community.', professionalExperience: 'Add your professional experience.', education: 'Add your education.', achievements: [], city: 'Not provided', country: 'Not provided', website: 'Not provided', socialMedia: 'Not provided', digitalSlug: user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }),
    businesses: stored?.businesses ?? demo?.businesses ?? [],
    articles: stored?.articles ?? demo?.articles ?? [],
    blogs: stored?.blogs ?? demo?.blogs ?? [],
    events: stored?.events ?? demo?.events ?? [],
  }
}

function readStoredDashboardData(email: string): Partial<UserDashboardData> | null {
  const stored = localStorage.getItem(DASHBOARD_DATA_KEY)
  if (!stored) return null
  try {
    const allData = JSON.parse(stored) as Record<string, Partial<UserDashboardData>>
    return allData[email.toLowerCase()] ?? null
  } catch {
    return null
  }
}

export function updateUserProfile(email: string, profile: UserProfileData) {
  const stored = JSON.parse(localStorage.getItem(DASHBOARD_DATA_KEY) ?? '{}') as Record<string, Partial<UserDashboardData>>
  stored[email.toLowerCase()] = { ...(stored[email.toLowerCase()] ?? {}), profile }
  localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(stored))
}

export function updateUserContent<T extends UserContentItem>(email: string, type: UserContentType, id: string, updates: Partial<T>) {
  const current = getUserDashboardData(email, { email, name: '', role: 'user', avatar: '' })
  const nextItems = current[type].map(item => item.id === id ? { ...item, ...updates } : item)
  const stored = JSON.parse(localStorage.getItem(DASHBOARD_DATA_KEY) ?? '{}') as Record<string, Partial<UserDashboardData>>
  stored[email.toLowerCase()] = { ...(stored[email.toLowerCase()] ?? {}), [type]: nextItems }
  localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(stored))
}

export interface UserReview {
  id: string
  companyId: string
  companyName: string
  companyLogo: string
  companyCategory: string
  rating: number
  text: string
  date: string
}

const REVIEWS_KEY = 'kbn_user_reviews'

function getReviews(): Record<string, UserReview[]> {
  const stored = localStorage.getItem(REVIEWS_KEY)
  if (stored) {
    try { return JSON.parse(stored) }
    catch { /* fall through */ }
  }

  const defaultReviews: Record<string, UserReview[]> = {
    'abel@example.com': [
      { id: 'ur1', companyId: 'covenant-builders', companyName: 'Kidus Builders Group', companyLogo: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=120&h=120&fit=crop&auto=format', companyCategory: 'Construction', rating: 5, text: 'Kidus Builders built our church addition and did an incredible job. The team was professional, on time, and their attention to detail was outstanding. I highly recommend them for any faith-based construction project.', date: '2025-05-14' },
      { id: 'ur2', companyId: 'refuge-wellness', companyName: 'Tsion Wellness Center', companyLogo: 'https://images.unsplash.com/photo-1572932491814-54869e8e5bac?w=120&h=120&fit=crop&auto=format', companyCategory: 'Healthcare', rating: 4, text: 'Attended a couples retreat here and it was transformative. The counselors were compassionate and the setting was peaceful. The only reason for 4 stars is that the guest rooms could use a refresh.', date: '2025-03-22' },
      { id: 'ur3', companyId: 'stewardship-wealth', companyName: 'Stewardship Wealth Management', companyLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&h=120&fit=crop&auto=format', companyCategory: 'Professional Services', rating: 5, text: 'Yohannes and his team helped us create a financial plan that aligns with our faith values. They took time to understand our goals and developed a comprehensive strategy. The biblical integration is genuine, not just a marketing angle.', date: '2025-02-10' },
    ],
    'tigist@example.com': [
      { id: 'ur4', companyId: 'generations-of-grace', companyName: 'Bereket Apparel', companyLogo: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=120&h=120&fit=crop&auto=format', companyCategory: 'Fashion', rating: 5, text: 'I love my Bereket Apparel hoodie! The quality is amazing — soft fabric, beautiful design, and it has sparked so many great conversations about my faith. Will definitely order more.', date: '2025-06-01' },
      { id: 'ur5', companyId: 'covenant-builders', companyName: 'Kidus Builders Group', companyLogo: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=120&h=120&fit=crop&auto=format', companyCategory: 'Construction', rating: 4, text: 'Good quality work on our community center project. The timeline stretched a bit longer than planned, but the end result was worth it. The team was always communicative about delays.', date: '2025-04-18' },
    ],
  }

  localStorage.setItem(REVIEWS_KEY, JSON.stringify(defaultReviews))
  return defaultReviews
}

function saveReviews(data: Record<string, UserReview[]>) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(data))
}

const userListeners = new Set<() => void>()

export function userSubscribe(fn: () => void): () => void {
  userListeners.add(fn)
  return () => { userListeners.delete(fn) }
}

function notify() {
  userListeners.forEach(fn => fn())
}

export function getUserReviews(userEmail: string): UserReview[] {
  return getReviews()[userEmail] ?? []
}

export function updateUserReview(userEmail: string, reviewId: string, updates: { rating?: number; text?: string }) {
  const all = getReviews()
  const userReviews = all[userEmail]
  if (!userReviews) return
  const idx = userReviews.findIndex(r => r.id === reviewId)
  if (idx === -1) return
  userReviews[idx] = { ...userReviews[idx], ...updates, date: new Date().toISOString().split('T')[0] }
  saveReviews(all)
  notify()
}

export function deleteUserReview(userEmail: string, reviewId: string) {
  const all = getReviews()
  const userReviews = all[userEmail]
  if (!userReviews) return
  all[userEmail] = userReviews.filter(r => r.id !== reviewId)
  saveReviews(all)
  notify()
}

export function addUserReview(userEmail: string, review: Omit<UserReview, 'id'>) {
  const all = getReviews()
  if (!all[userEmail]) all[userEmail] = []
  const newReview: UserReview = {
    ...review,
    id: 'ur' + Date.now(),
  }
  all[userEmail].push(newReview)
  saveReviews(all)
  notify()
  return newReview
}

export interface AppSubmission {
  companyName: string
  logo: string
  ownerName: string
  email: string
  phone: string
  website: string
  address: string
  category: Category
  description: string
  longDescription: string
  services: string[]
  tags: string[]
  licenseDoc: string
  socialLinks?: { platform: string; url: string }[]
  supportingDocs?: string[]
}

const ADMIN_KEY = 'kbn_admin'

function getAdminData() {
  const stored = localStorage.getItem(ADMIN_KEY)
  if (stored) {
    try { return JSON.parse(stored) }
    catch { /* fall through */ }
  }
  return { applications: [], listedCompanies: [], adminUsers: [], adminCategories: [] }
}

export function submitApplication(data: AppSubmission): void {
  const adminData = getAdminData()
  const newApp = {
    id: 'app-' + Date.now(),
    companyName: data.companyName,
    logo: data.logo,
    ownerName: data.ownerName,
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: data.address,
    category: data.category,
    description: data.description,
    longDescription: data.longDescription,
    services: data.services,
    tags: data.tags,
    licenseDoc: data.licenseDoc,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  }
  if (!adminData.applications) adminData.applications = []
  adminData.applications.push(newApp)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData))
  notify()
}
