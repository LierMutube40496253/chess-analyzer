import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In local dev, it's empty and Vite's proxy handles routing to localhost:5000.
const base = import.meta.env.VITE_API_URL ?? ''

export default axios.create({ baseURL: base })
