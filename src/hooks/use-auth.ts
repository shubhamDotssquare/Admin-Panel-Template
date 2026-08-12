import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/providers/auth-provider'

/** Access authentication state and actions. Must be used under `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.')
  }

  return context
}
