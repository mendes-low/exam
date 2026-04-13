import { useState, useCallback, useEffect, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";

import "../styles/exam.css";
import { db } from "../firebase";
import CodeTask from "../components/CodeTask/CodeTask";
import Question from "../components/Question/Question";

const questionsData = [
    {
        id: "q1",
        question: "React деген не ?",
        type: 'choice',
        options: [
            "Кітапхана",
            "JavaScript Кітапханасы",
            "Frontend Кітапханасы",
            "JavaScript-пен HTML-дың қосындысы",
        ],
    },
    {
        id: "q2",
        question: "npm run dev командасы не істейді ?",
        options: [
            "Проектті запускать ету үшін",
            "Проектті тоқтату үшін",
            "Проекттің папкасына кіріп запускать ету үшін",
            "ДЫМ",
        ],
    },
    {
        id: "q3",
        question: "Проекттің папкасына кіру командасы",
        type: 'input',
        options: [],
    },
    {
        id: "q4",
        question: "onCLick неге қолдануға болады ?",
        type: 'input',
        options: [],
    },
    {
        id: "q5",
        question: "Node.js деген не ?(өз сөзбен)",
        type: 'input',
        options: [],
    },
];

function Exam() {
    const { studentId } = useParams();

    const answersKey = `exam_answers_${studentId}`;
    const codeKey = `exam_code_${studentId}`;

    const timeoutRef = useRef(null);

    const loadAnswers = () => {
        try {
            const raw = localStorage.getItem(answersKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const [answers, setAnswers] = useState(loadAnswers);
    const [code, setCode] = useState("");

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(answersKey, JSON.stringify(answers));
            } catch (e) {
                console.error("LocalStorage error:", e);
            }
        }, 300);

        return () => clearTimeout(timeoutRef.current);
    }, [answers, answersKey]);

    const handleAnswer = useCallback((qId, answer) => {
        setAnswers((prev) => ({ ...prev, [qId]: answer }));
    }, []);

    async function handleSubmit() {
        try {
            await addDoc(collection(db, "submissions"), {
                studentId,
                answers,
                code,
                createdAt: serverTimestamp(),
            });

            alert("Submitted successfully ✅");
        } catch (error) {
            console.error(error);
            alert("Submission failed ❌");
        }
    }

    return (
        <div className="exam-container">
            <h1 className="exam-title">Exam for: {studentId}</h1>

            {questionsData.map((q) => (
                <Question
                    key={q.id}
                    data={q}
                    type={q.type}
                    selected={answers[q.id]}
                    onAnswer={handleAnswer}
                />
            ))}

            <div className="code-task">
                <CodeTask
                    value={code}
                    setValue={setCode}
                    storageKey={codeKey}
                />
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
                Submit
            </button>
        </div>
    );
}

export default Exam;
