import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RequestAccessPage from './pages/RequestAccessPage'
import EbooksPage from './pages/EbooksPage'
import ReaderPage from './pages/ReaderPage'
import AudiobooksPage from './pages/AudiobooksPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<Navigate to="/request-access" replace />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/books" element={<Navigate to="/ebooks" replace />} />
        <Route path="/ebooks" element={<ProtectedRoute><EbooksPage /></ProtectedRoute>} />
        <Route path="/read/:bookId" element={<ProtectedRoute><ReaderPage /></ProtectedRoute>} />
        <Route path="/audiobooks" element={<ProtectedRoute><AudiobooksPage /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
