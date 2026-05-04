import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InputPage from './pages/InputPage'
import MountainPage from './pages/MountainPage'
import WaypointDetail from './pages/WaypointDetail'
import Layout from './Layout'
import { ProgressProvider } from './lib/ProgressContext'

function App() {

  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          {/* routes outside the sky layout (own their backgrounds) */}
          <Route path='/' element={<InputPage />} />

          {/* routes that share the persistent sky */}
          <Route element={<Layout />}>
            <Route path='/mountain' element={<MountainPage />} />
            <Route path='/detail' element={<WaypointDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  )
}

export default App
