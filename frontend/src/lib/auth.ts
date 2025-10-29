const AUTH_FLAG = 'stock-control:auth-demo'
const REMEMBER_KEY = 'stock-control:remember-email'

const hasWindow = typeof window !== 'undefined'

export const authKeys = {
  authFlag: AUTH_FLAG,
  rememberKey: REMEMBER_KEY,
} as const

export const isAuthenticated = () =>
  hasWindow && window.localStorage.getItem(AUTH_FLAG) === 'true'

export const markAuthenticated = () => {
  if (hasWindow) {
    window.localStorage.setItem(AUTH_FLAG, 'true')
  }
}

export const clearAuthenticated = () => {
  if (hasWindow) {
    window.localStorage.removeItem(AUTH_FLAG)
  }
}

export const getRememberedEmail = () => {
  if (!hasWindow) {
    return ''
  }
  return window.localStorage.getItem(REMEMBER_KEY) ?? ''
}

export const setRememberedEmail = (email: string | null) => {
  if (!hasWindow) {
    return
  }
  if (email && email.trim()) {
    window.localStorage.setItem(REMEMBER_KEY, email.trim())
  } else {
    window.localStorage.removeItem(REMEMBER_KEY)
  }
}
