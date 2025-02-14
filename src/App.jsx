import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chatbot from "./components/Chatbot/Chatbot";
import CreateQuiz from "./components/CreateQuiz/CreateQuiz";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chatbot />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
      </Routes>
    </Router>
  );
}

export default App;