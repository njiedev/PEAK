import SkillInput from "../components/SkillInput"
import StarField from "../components/Starfield";

function InputPage() {
    return (
        <>
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            <StarField></StarField>
            <div className="relative z-10">
                <SkillInput></SkillInput>
            </div>

        </div>
        </>
    )
}

export default InputPage
