function ProgressBar({ progress }) {
    return (
        <div style={{ marginBottom: "20px" }}>
            <div
                style={{
                    height: "10px",
                    background: "#1e293b",
                    borderRadius: "10px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#38bdf8",
                        transition: "width 0.3s ease",
                    }}
                />
            </div>

            <p style={{ fontSize: "12px", marginTop: "5px" }}>
                Progress: 
            </p>
        </div>
    );
}

export default ProgressBar;
