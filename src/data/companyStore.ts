import { type Company } from "./companies"
import { companies as initialCompanies } from "./companies"

export type { Company } from "./companies"

const STORE_KEY = "kbn_companies"

function loadStoredCompanies(): Company[] {
  if (typeof localStorage === "undefined") return initialCompanies
  const stored = localStorage.getItem(STORE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return initialCompanies
    }
  }
  return initialCompanies
}

function persistCompanies(companies: Company[]) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(companies))
    } catch {
      // ignore storage quota issues
    }
  }
}

let _companies: Company[] = loadStoredCompanies()
const listeners = new Set<() => void>()

export function getCompanies(): Company[] {
  return _companies
}

export function getCompanyById(id: string): Company | undefined {
  return _companies.find((c) => c.id === id)
}

export function upsertCompany(company: Company) {
  const index = _companies.findIndex((c) => c.id === company.id)
  if (index >= 0) {
    _companies[index] = { ..._companies[index], ...company }
  } else {
    _companies = [company, ..._companies]
  }
  persistCompanies(_companies)
  listeners.forEach((fn) => fn())
}

export function updateCompany(id: string, data: Partial<Company>) {
  const exists = _companies.some((c) => c.id === id)
  if (exists) {
    _companies = _companies.map((c) => (c.id === id ? { ...c, ...data } : c))
  } else {
    _companies = [{ id, ...data } as Company, ..._companies]
  }
  persistCompanies(_companies)
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
