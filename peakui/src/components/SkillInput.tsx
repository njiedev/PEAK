import {useState} from "react";

function SkillInput() {
    const [skill, setSkill] = useState("")

    function handleSubmit() {
        console.log(skill)
    }

    return (
    <>
    <div className="flex w-full max-w-lg border border-white rounded px-4 py-2">
     <input 
     type="text" 
     placeholder="what do you want to learn?" 
     value={skill}
     onChange={(e) => setSkill(e.target.value)}
     onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit()
     }}
     className=" text-white w-full outline-none" />
     <button 
     onClick={handleSubmit} 
     className="rounded-full w-8 h-8 bg-gray-500 text-sm items-center justify-center text-white">
        →
     </button>

    </div>
    </>
    )
}

export default SkillInput