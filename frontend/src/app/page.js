"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

export default function Home() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
 
  
  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // We will assume backend runs on localhost:5000
      const res = await axios.get("http://localhost:5000/mood-history");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    analyzeEmotion(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setResult(null);
    setError(null);
  };

  const analyzeEmotion = async (base64Img) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Convert base64 to Blob
      const res = await fetch(base64Img);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const apiRes = await axios.post("http://localhost:5000/detect-mood", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setResult(apiRes.data);
      // Refresh history silently
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError("Failed to analyze emotion. Ensure backend and AI service are running.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  const getEmotionClass = (em) => {
    const lower = String(em).toLowerCase();
    if (['happy', 'sad', 'angry', 'surprised', 'neutral'].includes(lower)) {
      return `emotion-${lower}`;
    }
    return '';
  };

  return (
    <main className="container">
      <header>
        <h1>Mood Tracker AI</h1>
        <p className="subtitle">Detect your emotion in real-time</p>
      </header>

      <div className="glass-card">
        {error && <div className="error-message">{error}</div>}

        <div className="webcam-container">
          {!imgSrc ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: "user" }}
            />
          ) : (
            <img src={imgSrc} alt="Captured" style={{ width: "100%", borderRadius: "16px" }} />
          )}
        </div>

        <div className="actions">
          {!imgSrc ? (
            <button className="btn" onClick={capture} disabled={loading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
              Capture Emotion
            </button>
          ) : (
            <button className="btn" onClick={retake} disabled={loading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
              Try Again
            </button>
          )}
        </div>

        {loading && (
          <div className="result-display">
            <div className="loader"></div>
            <p>Analyzing utilizing AI...</p>
          </div>
        )}

        {result && (
          <div className="result-display">
            <h3>Detected Mood</h3>
            <div className={`emotion-tag ${getEmotionClass(result.emotion)}`}>
              {result.emotion}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {(result.confidence * 100).toFixed(1)}% Confidence
            </p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <h2 style={{ textAlign: "center" }}>Recent History</h2>
          <div className="history-grid">
            {history.map((record) => (
              <div key={record._id} className="history-item">
                <span className={`emotion-tag ${getEmotionClass(record.emotion)}`} style={{ fontSize: '1.2rem', padding: '0.2rem 1rem' }}>
                  {record.emotion}
                </span>
                <span className="history-time">{formatDate(record.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
