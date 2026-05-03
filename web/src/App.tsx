import { BrowserRouter, Routes, Route } from 'react-router-dom'
//import Hero from "./pages/Hero"
import InputPage from './pages/InputPage'
import MountainPage from './pages/MountainPage'
import WaypointLab from './pages/WaypointLab'
import WaypointDetail from './pages/WaypointDetail'
import Layout from './Layout'
import { ProgressProvider } from './lib/ProgressContext'
import './App.css'

function App() {

  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          {/* routes outside the sky layout (own their backgrounds) */}
          <Route path='/' element={<InputPage />} />
          <Route path='/waypoints' element={<WaypointLab />} />

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
