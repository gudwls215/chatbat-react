import { useState, useEffect, useRef } from "react";

const formatMessage = (content) => {
  return content.split(/<br\/>/g).map((line, index) => (
    <div key={index}>
      <br/>
      {line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </div>
  ));
};

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sseActive, setSseActive] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        chatBoxRef.current.scrollTop = scrollHeight;
      }
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

  return (
    <div className="chat-container">
      <div className="chat-box" ref={chatBoxRef} style={{ overflowY: "auto", maxHeight: "900px" }}>
        {messages.length === 0 && !loading && (
          <div className="bot">대화를 시작해보세요!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role}>
            {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
          </div>
        ))}
        {loading && (
          <div className="bot">
            <div className="spinner"></div>
          </div>
        )}
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
  );
}
