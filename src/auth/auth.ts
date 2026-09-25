export type UserRole = 'admin' | 'user' | 'company'

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  business?: string;
  companyId?: string;
}

interface StoredUser extends User {
  password: string;
}

const MOCK_USERS: StoredUser[] = [
  { id: 'u1', email: 'henok@kidusbuilders.com', name: 'Henok Kebede', avatar: 'https://i.pravatar.cc/96?img=11', password: 'password123', role: 'company', business: 'Kidus Builders Group', companyId: 'covenant-builders' },
  { id: 'u2', email: 'meron@tsionwellness.org', name: 'Meron Tadesse', avatar: 'https://i.pravatar.cc/96?img=47', password: 'password123', role: 'company', business: 'Tsion Wellness Center', companyId: 'refuge-wellness' },
  { id: 'u3', email: 'dawit@betesharetreat.org', name: 'Dawit Alemu', avatar: 'https://i.pravatar.cc/96?img=8', password: 'password123', role: 'company', business: 'Betesha Retreat & Conference Center', companyId: 'bethany-retreat' },
  { id: 'u4', email: 'bethlehem@bereketapparel.co', name: 'Bethlehem Haile', avatar: 'https://i.pravatar.cc/96?img=5', password: 'password123', role: 'company', business: 'Bereket Apparel', companyId: 'generations-of-grace' },
  { id: 'u5', email: 'yohannes@stewardshipwealth.org', name: 'Yohannes Assefa', avatar: 'https://i.pravatar.cc/96?img=6', password: 'password123', role: 'company', business: 'Stewardship Wealth Management', companyId: 'stewardship-wealth' },
  { id: 'admin1', email: 'admin@kbn.org', name: 'Admin KBN', avatar: 'https://i.pravatar.cc/96?img=68', password: 'password123', role: 'admin' },
  { id: 'regular1', email: 'abel@example.com', name: 'Abel Tesfaye', avatar: 'https://i.pravatar.cc/96?img=3', password: 'password123', role: 'user' },
  { id: 'regular2', email: 'tigist@example.com', name: 'Tigist Lemma', avatar: 'https://i.pravatar.cc/96?img=9', password: 'password123', role: 'user' },
]

function getStoredUsers(): StoredUser[] {
  const stored = localStorage.getItem('kbn_users')
  if (stored) {
    try { return JSON.parse(stored) }
    catch { return MOCK_USERS }
  }
  localStorage.setItem('kbn_users', JSON.stringify(MOCK_USERS))
  return MOCK_USERS
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem('kbn_users', JSON.stringify(users))
}

export function getStoredSession(): User | null {
  const s = localStorage.getItem('kbn_session')
  if (!s) return null
  try { return JSON.parse(s) }
  catch { return null }
}

function saveSession(user: User) {
  localStorage.setItem('kbn_session', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('kbn_session')
}

export async function login(email: string, password: string): Promise<User> {
  await new Promise(r => setTimeout(r, 800))
  const users = getStoredUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('No account found with this email address.')
  if (user.password !== password) throw new Error('Incorrect password. Please try again.')
  const { password: _, ...safeUser } = user
  saveSession(safeUser)
  return safeUser
}

export async function signUp(data: { name: string; email: string; password: string; business?: string }): Promise<User> {
  await new Promise(r => setTimeout(r, 800))
  const users = getStoredUsers()
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('An account with this email already exists.')
  }
  if (data.password.length < 6) throw new Error('Password must be at least 6 characters.')
  const imgIdx = (users.length + 1) * 7 % 70
  const newUser: StoredUser = {
    id: 'u' + (users.length + 1),
    email: data.email,
    name: data.name,
    avatar: `https://i.pravatar.cc/96?img=${imgIdx}`,
    password: data.password,
    role: 'user',
    business: data.business,
  }
  users.push(newUser)
  saveStoredUsers(users)
  const { password: _, ...safeUser } = newUser
  saveSession(safeUser)
  return safeUser
}

export async function logout(): Promise<void> {
  await new Promise(r => setTimeout(r, 300))
  clearSession()
}
