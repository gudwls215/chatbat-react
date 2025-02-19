import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const formatMessage = (content) => {
  if (typeof content !== 'string') {
    return <div></div>;
  }
  return content.split(/<br\/>/g).map((line, index) => (
    <div key={index}>
      <br />
      {line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </div>
  ));
};

const formatCategoryMessage = (content, handleCategoryItemClick) => {
  return content.split(', ').map((item, index) => (
    <div key={index} className="category-item" onClick={() => handleCategoryItemClick(item)}>
      {item}
    </div>
  ));
};

const formatCourseMessage = (courses) => {
  return courses.map((course, index) => (
    <div key={index} className="course-item">
      <img src={course.COURSE_IMAGE_FILE_PATH} alt={course.documents} style={{ width: '75px', height: '75px' }} />
      <div>{course.documents}</div>
      <div>{course.CATEGORY_NM}</div>
      <div>{course.DIFFICULTY}</div>
      <hr className="course-divider" />
    </div>
  ));
};

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sseActive, setSseActive] = useState(false);
  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || sseActive) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setLoading(true);
    setSseActive(true);
    setInput("");

    // 히스토리를 쿼리 문자열로 변환하여 서버로 전달
    const historyQuery = encodeURIComponent(JSON.stringify(messages));
    console.log(historyQuery);
    const eventSource = new EventSource(
      `http://192.168.0.147:8000/chat?user_message=${encodeURIComponent(input)}&history=${historyQuery}`
    );

    eventSource.onmessage = (event) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "bot") {
          setLoading(false);
          return [
            ...prev.slice(0, -1),
            { role: "bot", content: lastMessage.content + event.data }
          ];
        } else {
          setLoading(false);
          return [...prev, { role: "bot", content: event.data }];
        }
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSseActive(false);
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleCategoryClick = () => {
    const userMessage = { role: "user", content: "강의 카테고리 보기" };
    const botMessage = {
      role: "bot",
      content: "법정의무, 교양/생활/건강, 정보/컴퓨터, 취업/창업, 자격증, 외국어, 직무개발, 업무생산성, 공동역량",
      isCategory: true
    };
    setMessages([...messages, userMessage, botMessage]);
  };

  const handleCategoryItemClick = (item) => {
    fetch('http://192.168.0.147:8000/courses/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category: item })
    })
    .then(response => response.json())
    .then(data => {
      const courses = data.documents.map((doc, index) => ({
        documents: doc,
        ...data.metadatas[index]
      }));
      const botMessage = {
        role: "bot",
        content: courses,
        isCategory: false,
        isCourse: true
      };
      setMessages((prev) => [...prev, botMessage]);
    })
    .catch((error) => {
      console.error('Error:', error);
      const errorMessage = {
        role: "bot",
        content: "강의 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        isCategory: false
      };
      setMessages((prev) => [...prev, errorMessage]);
    });
  };

  return (
    <div className="App">
      <h1>AI 챗봇</h1>

      <div className="chat-container">
        <button onClick={() => navigate('/create-quiz')} className="move-quiz-button">문제 생성하기</button>
        <div className="chat-box" ref={chatBoxRef} style={{ overflowY: "auto", maxHeight: "900px", position: "relative" }}>
          {messages.length === 0 && !loading && (
            <div className="bot">대화를 시작해보세요!</div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role}>
              {msg.role === 'user' ? msg.content : (msg.isCategory ? formatCategoryMessage(msg.content, handleCategoryItemClick) : (msg.isCourse ? formatCourseMessage(msg.content) : formatMessage(msg.content)))}
            </div>
          ))}
          {loading && (
            <div className="bot">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <div className="fixed-buttons">
          <button onClick={handleCategoryClick} className="view-categories-button">강의 카테고리 보기</button>
          <button onClick={() => navigate('/lecture-categories')} className="view-categories-button">강의 검색</button>
        </div>
        <div className="input-box">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={sseActive}
          />
          <button onClick={sendMessage} disabled={sseActive}>전송</button>
        </div>
      </div>
    </div>
  );
}