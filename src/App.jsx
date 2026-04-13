import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Exam from "./pages/Exam";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/:studentId" element={<Exam />} />
            </Routes>
        </Router>
    );
}

export default App;
