import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('domt_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // On mount, verify token is still valid
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('domt_token')
      if (token) {
        try {
          const { data } = await authAPI.getMe()
          setUser(data.user)
          localStorage.setItem('domt_user', JSON.stringify(data.user))
        } catch {
          localStorage.removeItem('domt_token')
          localStorage.removeItem('domt_user')
          setUser(null)
        }
      }
      setLoading(false)
    }
    verify()
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('domt_token', data.token)
    localStorage.setItem('domt_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('domt_token')
    localStorage.removeItem('domt_user')
    setUser(null)
  }

  const updateUser = (updated) => {
    setUser(updated)
    localStorage.setItem('domt_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
