import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setLoading(true); // 로딩 시작

    try {
      const response = await fetch("http://192.168.0.147:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: input }),
      });

      const data = await response.json();
      const botMessage = { role: "bot", content: data.generated_text };

      setMessages((prev) => [...prev, botMessage]);
      setInput("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {/* messages 배열이 비어 있어도 채팅박스는 비어있지 않게 유지 */}
        {messages.length === 0 && !loading && (
          <div className="bot">대화를 시작해보세요!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bot">
            <div className="spinner"></div> {/* 로딩 스피너 */}
          </div>
        )}
      </div>
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress} // Enter 키 이벤트 처리
          placeholder="메시지를 입력하세요..."
        />
        <button onClick={sendMessage}>전송</button>
      </div>
    </div>
  );
}
