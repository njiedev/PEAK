import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SkillInput() {
    const [skill, setSkill] = useState("")
    const navigate = useNavigate()

    function handleSubmit() {
        const trimmedSkill = skill.trim()
        if (!trimmedSkill) return

        navigate("/mountain", { state: { skill: trimmedSkill } })
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
     className="w-full bg-transparent text-white outline-none" />
     <button
     onClick={handleSubmit}
     className="rounded-full w-8 h-8 bg-gray-500 text-sm flex items-center justify-center text-white">
        →
     </button>

    </div>
    </>
    )
}

export default SkillInput
