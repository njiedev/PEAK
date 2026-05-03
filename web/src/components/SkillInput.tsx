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
        <div className="space-signal-input">
            <input
                type="text"
                placeholder="what do you want to learn?"
                value={skill}
                disabled={disabled}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit()
                }}
                className="space-signal-field"
            />
        </div>
    )
}

export default SkillInput
