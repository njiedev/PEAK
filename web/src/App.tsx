import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InputPage from './pages/InputPage'
import MountainPage from './pages/MountainPage'
import WaypointDetail from './pages/WaypointDetail'
import Layout from './Layout'
import { ProgressProvider } from './lib/ProgressContext'
import { MountainProvider } from './lib/MountainContext'
import AppShell from './AppShell'

function App() {

  return (
    <MountainProvider>
    <ProgressProvider>
      <BrowserRouter>
      <AppShell>
        <Routes>
          {/* routes outside the sky layout (own their backgrounds) */}
          <Route path='/' element={<InputPage />} />

          {/* routes that share the persistent sky */}
          <Route element={<Layout />}>
            <Route path='/mountain' element={<MountainPage />} />
            <Route path='/mountain/:mountainId' element={<MountainPage />} />
            <Route path='/detail' element={<WaypointDetail />} />
          </Route>
        </Routes>
      </AppShell>
      </BrowserRouter>
    </ProgressProvider>
    </MountainProvider>
  )
}

export default App
