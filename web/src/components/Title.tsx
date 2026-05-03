function Title() {


    return (
        <>
        <div className="flex gap-4 mb-8">
        {["P", "E", "A", "K"].map((letter, i) => (
            <span
            key={letter}
            className="text-white font-bold text-8xl"
            style={{
                animation: `drift ${3 + i * 0.5}s ${i * 0.3}s infinite alternate ease-in-out`,
            }}
            >
            {letter}
            </span>
        ))}
        </div>
        </>
    )
}

export default Title