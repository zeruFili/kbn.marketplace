import { useMemo, useState } from 'react'

type PaymentStatus = 'Paid' | 'Unpaid'
type AccountStatus = 'Active' | 'Deactive'

type PaymentUser = {
  id: string
  name: string
  email: string
  avatar: string
  paymentStatus: PaymentStatus
  accountStatus: AccountStatus
  lastPaymentMonth: string
  paidMonths: string[]
}

const PAYMENT_USERS: PaymentUser[] = [
  { id: 'payment-1', name: 'Abel Tesfaye', email: 'abel@example.com', avatar: 'https://i.pravatar.cc/96?img=3', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'September 2025', paidMonths: ['July 2025', 'August 2025', 'September 2025'] },
  { id: 'payment-2', name: 'Tigist Lemma', email: 'tigist@example.com', avatar: 'https://i.pravatar.cc/96?img=9', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'September 2025', paidMonths: ['July 2025', 'August 2025', 'September 2025'] },
  { id: 'payment-3', name: 'Samuel Bekele', email: 'samuel@example.com', avatar: 'https://i.pravatar.cc/96?img=12', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'September 2025', paidMonths: ['June 2025', 'July 2025', 'August 2025', 'September 2025'] },
  { id: 'payment-4', name: 'Mimi Assefa', email: 'mimi@example.com', avatar: 'https://i.pravatar.cc/96?img=20', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'August 2025', paidMonths: ['June 2025', 'July 2025', 'August 2025'] },
  { id: 'payment-5', name: 'Dawit Girma', email: 'dawit@example.com', avatar: 'https://i.pravatar.cc/96?img=14', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'September 2025', paidMonths: ['July 2025', 'August 2025', 'September 2025'] },
  { id: 'payment-6', name: 'Ruth Worku', email: 'ruth@example.com', avatar: 'https://i.pravatar.cc/96?img=24', paymentStatus: 'Paid', accountStatus: 'Active', lastPaymentMonth: 'September 2025', paidMonths: ['August 2025', 'September 2025'] },
  { id: 'payment-7', name: 'Yonas Haile', email: 'yonas@example.com', avatar: 'https://i.pravatar.cc/96?img=15', paymentStatus: 'Paid', accountStatus: 'Deactive', lastPaymentMonth: 'August 2025', paidMonths: ['June 2025', 'July 2025', 'August 2025'] },
  { id: 'payment-8', name: 'Hanna Solomon', email: 'hanna@example.com', avatar: 'https://i.pravatar.cc/96?img=25', paymentStatus: 'Paid', accountStatus: 'Deactive', lastPaymentMonth: 'July 2025', paidMonths: ['May 2025', 'June 2025', 'July 2025'] },
  { id: 'payment-9', name: 'Michael Tadesse', email: 'michael@example.com', avatar: 'https://i.pravatar.cc/96?img=13', paymentStatus: 'Unpaid', accountStatus: 'Active', lastPaymentMonth: 'June 2025', paidMonths: ['April 2025', 'May 2025', 'June 2025'] },
  { id: 'payment-10', name: 'Liya Desta', email: 'liya@example.com', avatar: 'https://i.pravatar.cc/96?img=29', paymentStatus: 'Unpaid', accountStatus: 'Active', lastPaymentMonth: 'May 2025', paidMonths: ['March 2025', 'April 2025', 'May 2025'] },
  { id: 'payment-11', name: 'Daniel Kebede', email: 'daniel@example.com', avatar: 'https://i.pravatar.cc/96?img=17', paymentStatus: 'Unpaid', accountStatus: 'Active', lastPaymentMonth: 'April 2025', paidMonths: ['February 2025', 'March 2025', 'April 2025'] },
  { id: 'payment-12', name: 'Sara Mengistu', email: 'sara@example.com', avatar: 'https://i.pravatar.cc/96?img=32', paymentStatus: 'Unpaid', accountStatus: 'Active', lastPaymentMonth: 'March 2025', paidMonths: ['January 2025', 'February 2025', 'March 2025'] },
  { id: 'payment-13', name: 'Nathaniel Alemu', email: 'nathaniel@example.com', avatar: 'https://i.pravatar.cc/96?img=18', paymentStatus: 'Unpaid', accountStatus: 'Deactive', lastPaymentMonth: 'February 2025', paidMonths: ['January 2025', 'February 2025'] },
  { id: 'payment-14', name: 'Bethlehem Kassa', email: 'bethlehem@example.com', avatar: 'https://i.pravatar.cc/96?img=35', paymentStatus: 'Unpaid', accountStatus: 'Deactive', lastPaymentMonth: 'January 2025', paidMonths: ['December 2024', 'January 2025'] },
  { id: 'payment-15', name: 'Eyob Fikre', email: 'eyob@example.com', avatar: 'https://i.pravatar.cc/96?img=19', paymentStatus: 'Unpaid', accountStatus: 'Deactive', lastPaymentMonth: 'December 2024', paidMonths: ['November 2024', 'December 2024'] },
]

export default function AdminPayments() {
  const [users, setUsers] = useState(PAYMENT_USERS)
  const [selected, setSelected] = useState<PaymentUser | null>(null)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | AccountStatus>('all')

  const filtered = useMemo(() => users.filter(user => {
    if (paymentFilter !== 'all' && user.paymentStatus !== paymentFilter) return false
    if (accountFilter !== 'all' && user.accountStatus !== accountFilter) return false
    if (search) {
      const query = search.toLowerCase()
      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    }
    return true
  }), [users, paymentFilter, accountFilter, search])

  function updateAccountStatus(status: AccountStatus) {
    if (!selected) return
    setUsers(current => current.map(user => user.id === selected.id ? { ...user, accountStatus: status } : user))
    setSelected(current => current ? { ...current, accountStatus: status } : current)
  }

  if (selected) {
    return <div className="animate-scale-in"><PaymentUserDetail user={selected} onBack={() => setSelected(null)} onStatusChange={updateAccountStatus} /></div>
  }

  const paid = users.filter(user => user.paymentStatus === 'Paid').length
  const unpaid = users.length - paid
  const active = users.filter(user => user.accountStatus === 'Active').length
  const deactive = users.length - active

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'border-l-[var(--brand)]' },
          { label: 'Paid', value: paid, color: 'border-l-emerald-500' },
          { label: 'Unpaid', value: unpaid, color: 'border-l-amber-500' },
          { label: 'Active', value: active, color: 'border-l-blue-500' },
        ].map(stat => <div key={stat.label} className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${stat.color} p-4`}><div className="font-serif text-2xl text-[var(--text-primary)] font-bold">{stat.value}</div><div className="text-xs text-[var(--text-tertiary)]">{stat.label}</div></div>)}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <PaymentFilter label="Payment" value={paymentFilter} options={['all', 'Paid', 'Unpaid']} onChange={value => setPaymentFilter(value as typeof paymentFilter)} />
          <PaymentFilter label="Account" value={accountFilter} options={['all', 'Active', 'Deactive']} onChange={value => setAccountFilter(value as typeof accountFilter)} />
          <span className="text-xs text-[var(--text-tertiary)] ml-auto">{deactive} deactive</span>
        </div>
        <div className="relative w-full sm:w-64 self-end">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="search" placeholder="Search users..." value={search} onChange={event => setSearch(event.target.value)} className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
          <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">User</th>
          <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3 hidden md:table-cell">Email</th>
          <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">Payment</th>
          <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">Account</th>
          <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3 hidden sm:table-cell">Last payment</th>
          <th className="text-right text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">Action</th>
        </tr></thead><tbody className="divide-y divide-[var(--border-light)]">
          {filtered.map(user => <PaymentUserRow key={user.id} user={user} onSelect={() => setSelected(user)} />)}
        </tbody></table></div>
        {filtered.length === 0 && <div className="text-center py-12"><p className="text-sm text-[var(--text-tertiary)]">No payment records found.</p></div>}
      </div>
    </div>
  )
}

function PaymentFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1"><span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase px-2">{label}</span>{options.map(option => <button key={option} onClick={() => onChange(option)} className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${value === option ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>{option === 'all' ? 'All' : option}</button>)}</div>
}

function PaymentUserRow({ user, onSelect }: { user: PaymentUser; onSelect: () => void }) {
  return <tr className="hover:bg-[var(--surface-alt)] transition-colors">
    <td className="px-3 sm:px-5 py-3"><button onClick={onSelect} className="flex items-center gap-2 sm:gap-3 text-left"><img src={user.avatar} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover ring-2 ring-[var(--border-light)]" /><span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</span></button></td>
    <td className="px-3 sm:px-5 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{user.email}</td>
    <td className="px-3 sm:px-5 py-3"><StatusBadge status={user.paymentStatus} /></td>
    <td className="px-3 sm:px-5 py-3"><StatusBadge status={user.accountStatus} /></td>
    <td className="px-3 sm:px-5 py-3 text-xs text-[var(--text-tertiary)] hidden sm:table-cell">{user.lastPaymentMonth}</td>
    <td className="px-3 sm:px-5 py-3 text-right"><button onClick={onSelect} className="text-xs font-medium text-[var(--brand)] hover:underline">View</button></td>
  </tr>
}

function StatusBadge({ status }: { status: PaymentStatus | AccountStatus }) {
  const color = status === 'Paid' || status === 'Active' ? 'bg-emerald-100 text-emerald-700' : status === 'Unpaid' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>{status}</span>
}

function PaymentUserDetail({ user, onBack, onStatusChange }: { user: PaymentUser; onBack: () => void; onStatusChange: (status: AccountStatus) => void }) {
  return <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
    <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Back to payments</button><StatusBadge status={user.accountStatus} /></div>
    <div className="p-5 sm:p-8">
      <div className="flex items-center gap-4 sm:gap-5 mb-8"><img src={user.avatar} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-[var(--border-light)]" /><div><h1 className="font-serif text-2xl text-[var(--text-primary)]">{user.name}</h1><p className="text-sm text-[var(--text-tertiary)] mt-1">{user.email}</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8"><PaymentInfo label="Payment status" value={user.paymentStatus} /><PaymentInfo label="Account status" value={user.accountStatus} /><PaymentInfo label="Last payment month" value={user.lastPaymentMonth} /></div>
      <div className="border-t border-[var(--border-light)] pt-6 mb-8"><h2 className="font-serif text-xl text-[var(--text-primary)] mb-4">Paid months</h2><div className="space-y-2">{user.paidMonths.map(month => <div key={month} className="flex items-center justify-between p-3 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]"><span className="text-sm text-[var(--text-primary)]">{month}</span><span className="text-xs font-semibold text-emerald-700">Paid</span></div>)}</div></div>
      <div className="border-t border-[var(--border-light)] pt-6"><h2 className="font-serif text-xl text-[var(--text-primary)] mb-4">Account status</h2><div className="flex flex-wrap gap-2"><button onClick={() => onStatusChange('Active')} className={`text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${user.accountStatus === 'Active' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>Active</button><button onClick={() => onStatusChange('Deactive')} className={`text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${user.accountStatus === 'Deactive' ? 'bg-red-600 text-white' : 'border border-red-200 text-red-600 hover:bg-red-50'}`}>Deactive</button></div></div>
    </div>
  </div>
}

function PaymentInfo({ label, value }: { label: string; value: string }) {
  return <div><label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{label}</label><p className="text-sm font-medium text-[var(--text-primary)]">{value}</p></div>
}
