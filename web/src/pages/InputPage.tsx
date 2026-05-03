import SkillInput from "../components/SkillInput"
import StarField from "../components/Starfield";
import Star from "../components/Starfield";
import { useEffect, useState } from "react"





function InputPage() {


    return (
        <>
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            <StarField></StarField>
            <div className="relative z-10 w-full max-w-lg px-4">
                <SkillInput></SkillInput>
            </div>

        </div>
        </>
    )
}

export default InputPage