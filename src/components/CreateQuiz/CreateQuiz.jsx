import React, { useState } from 'react';
import './CreateQuiz.css';
import axios from 'axios';

export default function CreateQuiz() {
  const [selectedButton, setSelectedButton] = useState('문맥');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState('객관식');
  const [optionCount, setOptionCount] = useState(4);
  const [questionCount, setQuestionCount] = useState(1);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = (button) => {
    setSelectedButton(button);
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionType(type);
    if (type !== '객관식') {
      setOptionCount(0);
    } else {
      setOptionCount(4);
    }
  };

  const handleCreateQuiz = () => {
    const quizTypeMap = {
      '객관식': 'M',
      '단답식': 'S',
      '참/거짓': 'T'
    };

    const dataTypeMap = {
      '문맥': 'T',
      '주제': 'S',
      'PDF': 'P'
    };

    const data = document.getElementById('text-input').value;

    const payload = {
      quiz_type: quizTypeMap[questionType],
      data_type: dataTypeMap[selectedButton],
      data: data,
      amount: questionCount,
      option: questionType === '객관식' ? optionCount : 0
    };

    setLoading(true);
    axios.post('http://192.168.0.147:8000/quiz', payload)
      .then(response => {
        
        const parsedQuizData = JSON.parse(response.data);
        console.log('Quiz created successfully:', parsedQuizData.questions);
        setQuizData(parsedQuizData);
        setIsModalOpen(false);
        setLoading(false);
      })
      .catch(error => {
        console.error('There was an error creating the quiz:', error);
        setLoading(false);
      });
  };

  return (
    <div className="App">
      <h1>문제 생성</h1>
      <div className={`create-quiz-container ${quizData ? 'with-preview' : ''}`}>
        <div className="selection-buttons">
          <button
            className={selectedButton === '문맥' ? 'selected' : ''}
            onClick={() => handleButtonClick('문맥')}
          >
            문맥
          </button>
          <button
            className={selectedButton === '주제' ? 'selected' : ''}
            onClick={() => handleButtonClick('주제')}
          >
            주제
          </button>
          <button
            className={selectedButton === 'PDF' ? 'selected' : ''}
            onClick={() => handleButtonClick('PDF')}
          >
            PDF
          </button>
        </div>
        <div className="create-quiz-box">
          <textarea placeholder="문제를 생성할 단락을 입력하세요..." id="text-input">
            인공지능(AI)은 인간의 인지 능력을 모방할 수 있는 지능적인 기계를 만드는 기술과 연구 분야입니다...
          </textarea>
          <button className="create-quiz-button" onClick={handleModalOpen}>퀴즈 생성</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>문제 유형 선택</h2>
              <button onClick={handleModalClose}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="selection-buttons">
                <button
                  className={questionType === '객관식' ? 'selected' : ''}
                  onClick={() => handleQuestionTypeChange('객관식')}
                >
                  객관식
                </button>
                <button
                  className={questionType === '단답식' ? 'selected' : ''}
                  onClick={() => handleQuestionTypeChange('단답식')}
                >
                  단답식
                </button>
                <button
                  className={questionType === '참/거짓' ? 'selected' : ''}
                  onClick={() => handleQuestionTypeChange('참/거짓')}
                >
                  참/거짓
                </button>
              </div>
              <label>
                옵션 수:
                <select value={optionCount} onChange={(e) => setOptionCount(e.target.value)} disabled={questionType !== '객관식'}>
                  {[...Array(10).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                질문 수:
                <select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
                  {[...Array(10).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={handleCreateQuiz}>생성</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mask">
          <div className="spinner"></div>
        </div>
      )}

      {quizData && Array.isArray(quizData.questions) && (
        <div className="quiz-preview">
          <h3>퀴즈 미리보기</h3>
          {quizData.questions.map((question) => (
            <div key={question.id} className="question">
              <h4>{question.question}</h4>
              <ul className="options">
                {question.options.map((option) => (
                  <li key={option.id}>{option.text}</li>
                ))}
              </ul>
              <p><strong>정답:</strong> {question.correct_answer}</p>
              <p><strong>설명:</strong> {question.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}