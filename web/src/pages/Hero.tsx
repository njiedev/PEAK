import { useNavigate } from "react-router-dom"


function Hero() {
    const navigate = useNavigate()


    return (
    <>
     <div className='min-h-screen bg-[#343d46] flex flex-col items-center justify-center gap-5'>
      <h1 className='text-9xl font-bold text-white'>PEAK</h1>
      <p
      className="text-white"
      >this is what peak is about</p>
      <button 
      onClick={() => navigate("/start")}
      className="btn rounded px-4 py-2 bg-[#a7adba] text-[#343d46] text-md font-bold"
      >
        Get Started
        </button>
    
     </div>
    </>
  )
}

export default Hero