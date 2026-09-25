import { type Company } from './companies'
import { companies as initialCompanies } from './companies'

export type { Company } from './companies'

let _companies: Company[] = JSON.parse(JSON.stringify(initialCompanies))
const listeners = new Set<() => void>()

export function getCompanies(): Company[] {
  return _companies
}

export function getCompanyById(id: string): Company | undefined {
  return _companies.find(c => c.id === id)
}

export function updateCompany(id: string, data: Partial<Company>) {
  _companies = _companies.map(c => c.id === id ? { ...c, ...data } : c)
  listeners.forEach(fn => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
