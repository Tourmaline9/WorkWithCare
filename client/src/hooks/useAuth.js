import { useCallback, useEffect, useState } from 'react'
import { fetchMe } from '../api/auth'

export const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem('wwc_token'))
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  const login = useCallback((authToken, authUser) => {
    localStorage.setItem('wwc_token', authToken)
    setToken(authToken)
    setUser(authUser)
    setIsReady(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('wwc_token')
    setToken(null)
    setUser(null)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsReady(true)
      return
    }

    let active = true

    fetchMe(token)
      .then((data) => {
        if (!active) return
        setUser(data.user)
        setIsReady(true)
      })
      .catch(() => {
        if (!active) return
        logout()
      })

    return () => {
      active = false
    }
  }, [token, logout])

  return { token, user, isReady, login, logout }
}
