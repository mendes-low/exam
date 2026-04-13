import { memo } from "react";
import "./Question.css";

// type: "choice" | "input"
function Question({ data, onAnswer, selected, type = "choice" }) {
    return (
        <div className="question">
            <h3>{data.question}</h3>

            {type === "choice" ? (
                <div className="question__options">
                    {data.options.map((opt) => (
                        <button
                            key={opt}
                            className={`question__option ${selected === opt ? "question__option--selected" : ""}`}
                            onClick={() => onAnswer(data.id, opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            ) : (
                <input
                    className="question__input"
                    type="text"
                    value={selected || ""}
                    placeholder="Type your answer..."
                    onChange={(e) => onAnswer(data.id, e.target.value)}
                />
            )}
        </div>
    );
}

export default memo(Question);
