function Title() {
    return (
        <div className="peak-title" aria-label="PEAK">
            {["P", "E", "A", "K"].map((letter, i) => (
                <span
                    key={letter}
                    className="peak-title-letter"
                    aria-hidden="true"
                    style={{
                        animationDelay: `${i * 0.18}s`,
                        animationDuration: `${4.4 + i * 0.35}s`,
                    }}
                >
                    {letter}
                </span>
            ))}
        </div>
    )
}

export default Title
