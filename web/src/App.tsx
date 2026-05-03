import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Hero from "./pages/Hero"
import InputPage from './pages/InputPage'
import MountainPage from './pages/MountainPage'
import './App.css'

function App() {

  return (
    <>
     <BrowserRouter>
      <Routes>
        <Route path='/' element={<Hero />}></Route>
        <Route path='/start' element={<InputPage />}></Route>
        <Route path='/mountain' element={<MountainPage />}></Route>
      </Routes>
     </BrowserRouter>
    </>
  )
}

export default App
