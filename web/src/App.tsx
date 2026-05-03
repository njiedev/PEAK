import { BrowserRouter, Routes, Route } from 'react-router-dom'
//import Hero from "./pages/Hero"
import InputPage from './pages/InputPage'
import MountainPage from './pages/MountainPage'
import WaypointLab from './pages/WaypointLab'
import WaypointDetail from './pages/WaypointDetail'
import './App.css'

function App() {

  return (
    <>
     <BrowserRouter>
      <Routes>
        <Route path='/' element={<InputPage />}></Route>
        <Route path='/mountain' element={<MountainPage />}></Route>
        <Route path='/waypoints' element={<WaypointLab />}></Route>
        <Route path='/detail' element={<WaypointDetail />}></Route>
      </Routes>
     </BrowserRouter>
    </>
  )
}

export default App
