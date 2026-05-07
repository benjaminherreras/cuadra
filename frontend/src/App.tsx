import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NoiseBg from './components/NoiseBg'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SessionDetail from './pages/SessionDetail'
import Reconcile from './pages/Reconcile'

export default function App() {
  return (
    <BrowserRouter>
      <NoiseBg />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:sessionId" element={<SessionDetail />} />
        <Route path="/reconcile" element={<Reconcile />} />
      </Routes>
    </BrowserRouter>
  )
}
