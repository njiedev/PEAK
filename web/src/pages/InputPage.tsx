import SkillInput from "../components/SkillInput"
import StarField from "../components/Starfield";
import Star from "../components/Starfield";
import { useEffect, useState } from "react"





function InputPage() {


    return (
        <>
        <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden items-center justify-center gap-5">
            <StarField></StarField>
            <h1 className='text-9xl font-bold text-white'>PEAK</h1>
            <p
            className="text-white"
            >this is what peak is about</p>
            <div className="relative z-10 w-full max-w-lg px-4">
                <SkillInput></SkillInput>
            </div>

        </div>
        </>
    )
}

export default InputPage