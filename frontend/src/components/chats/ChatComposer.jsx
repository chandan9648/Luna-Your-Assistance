import React, { useCallback, useRef, useLayoutEffect, useEffect, useState } from "react";
import "./ChatComposer.css";

// NOTE: Public API (props) kept identical for drop-in upgrade
const ChatComposer = ({ input, setInput, onSend, isSending }) => {
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Auto-grow textarea height up to max-height
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  }, [input]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim()) onSend();
      }
    },
    [onSend, input]
  );

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false; // end after a pause
    recognition.interimResults = true;

    recognition.onstart = () => {
      baseTextRef.current = input; // remember existing text
      setListening(true);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interimTranscript += res[0].transcript;
      }
      const combined = (baseTextRef.current + " " + (finalTranscript || interimTranscript)).trim();
      setInput(combined);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (!speechSupported || !recognitionRef.current) return;
    try {
      if (listening) recognitionRef.current.stop();
      else recognitionRef.current.start();
    } catch { /* ignore */ }
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) onSend();
      }}
    >
      <div
        className="composer-surface"
        data-state={isSending ? "sending" : undefined}
      >
        <div className="composer-field">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Message with Luna…"
            aria-label="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            spellCheck
            autoComplete="off"
          />
          <div className="composer-hint" aria-hidden="true">
            Enter ↵ to send • Shift+Enter = newline
          </div>
        </div>
        {speechSupported && (
          <button
            type="button"
            className={"mic-btn icon-btn" + (listening ? " listening" : "")}
            onClick={toggleMic}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            disabled={isSending}
            title={listening ? "Listening… click to stop" : "Voice input"}
          >
            <span aria-hidden="true">
              {/* mic icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </span>
          </button>
        )}
        <button
          type="submit"
          className="send-btn icon-btn"
          disabled={!input.trim() || isSending}
          aria-label={isSending ? "Sending…" : "Send message"}
        >
          <span className="send-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </form>
  );
};

export default ChatComposer;
