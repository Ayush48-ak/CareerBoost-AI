import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    api.get('/api/auth/me')
      .then(response => {
        setUser(response.data)
      })
      .catch(error => {
        console.error('Auth check failed:', error)
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (email, password) => {
    const form = new URLSearchParams()

    form.append('username', email)
    form.append('password', password)

    const response = await api.post(
      '/api/auth/login',
      form,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    console.log('LOGIN RESPONSE:', response.data)

    const token = response.data.access_token

    if (!token) {
      throw new Error('Login succeeded but no access token was returned')
    }

    localStorage.setItem('token', token)

    if (response.data.user) {
      setUser(response.data.user)
    } else {
      const meResponse = await api.get('/api/auth/me')
      setUser(meResponse.data)
    }

    return response.data
  }

  const register = async (name, email, password) => {
    const response = await api.post(
      '/api/auth/register',
      {
        name,
        email,
        password
      }
    )

    console.log('REGISTER RESPONSE:', response.data)

    const token =
      response.data.access_token ||
      response.data.token

    if (!token) {
      throw new Error('Registration succeeded but no token was returned')
    }

    localStorage.setItem('token', token)

    if (response.data.user) {
      setUser(response.data.user)
    } else {
      const meResponse = await api.get('/api/auth/me')
      setUser(meResponse.data)
    }

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)