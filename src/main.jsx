import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

const hasSupabaseEnv =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

const App = React.lazy(() => import('./App.jsx'))

function EnvMissingScreen() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <section style={{ maxWidth: '42rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.75rem' }}>Missing Supabase configuration</h1>
        <p style={{ lineHeight: 1.6 }}>
          Add
          {' '}
          <strong>VITE_SUPABASE_URL</strong>
          {' '}
          and
          {' '}
          <strong>VITE_SUPABASE_ANON_KEY</strong>
          {' '}
          in your Vercel Project Settings, then redeploy.
        </p>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasSupabaseEnv ? (
      <React.Suspense fallback={null}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.Suspense>
    ) : (
      <EnvMissingScreen />
    )}
  </React.StrictMode>,
)
