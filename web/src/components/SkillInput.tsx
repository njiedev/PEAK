import { useState } from "react";

type SkillInputProps = {
    disabled?: boolean
    onSubmit?: (skill: string) => void
}

function SkillInput({ disabled = false, onSubmit }: SkillInputProps) {
    const [skill, setSkill] = useState("")

    function handleSubmit() {
        const trimmedSkill = skill.trim()
        if (!trimmedSkill || disabled) return

        onSubmit?.(trimmedSkill)
    }

    return (
    <>
    <div className="flex w-full max-w-lg border border-white text-center rounded px-4 py-2">
     <input 
     type="text" 
     placeholder="what do you want to learn?" 
     value={skill}
     disabled={disabled}
     onChange={(e) => setSkill(e.target.value)}
     onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit()
     }}
     className="w-full bg-transparent text-white outline-none" />
     <button
     onClick={handleSubmit}
     disabled={disabled}
     className="rounded-full w-8 h-8 bg-gray-500 text-sm flex items-center justify-center text-white disabled:opacity-50">
        →
     </button>

    </div>
    </>
    )
}

export default SkillInput
