import axios from 'axios'

const api = axios.create({
  baseURL: 'https://careerboost-ai-1-42fh.onrender.com'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api