import { type Category } from './companies'

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
