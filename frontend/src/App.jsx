import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import CoursesPage from './pages/CoursesPage'
import AllocationsPage from './pages/AllocationsPage'
import AiAssistantPage from './pages/AiAssistantPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}
