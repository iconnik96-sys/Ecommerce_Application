import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/api';
import { getProductImage } from '../utils/productImages';

const QUICK_PROMPTS = [
  "What's the best keyboard for programming?",
  "Recommend a clean desk setup under $150",
  "Do you have portable travel accessories?",
  "Which noise-cancelling headphones are best?"
];

export default function AiChatWidget({ currentUser, onAddToCart, onViewDetails, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello. I'm your Luminary Concierge. Looking for ergonomic accessories, workspace upgrades, or a specific setup recommendation? Ask me anything.",
      recommendedProducts: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    if (!currentUser) {
      showToast('Please sign in to chat with Luminary Concierge.', 'error');
      return;
    }

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Format history for backend (excluding the initial greeting)
      const history = newMessages
        .slice(1, -1)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await aiService.chat(text, history);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || "Here are a few options from our catalog that match your request.",
          recommendedProducts: res.recommendedProducts || []
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      const msg = err.response?.data?.message || 'The AI assistant is temporarily unavailable. Please try again shortly.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Apologies: ${msg}`,
          recommendedProducts: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <div className="ai-widget-container">
      {/* Floating Toggle Button */}
      <button 
        type="button"
        className={`ai-fab-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI Concierge" : "Open AI Concierge"}
        title="Luminary AI Concierge"
      >
        <span className="ai-fab-icon">✦</span>
        <span className="ai-fab-text">Ask AI</span>
      </button>

      {/* Slide-in Chat Panel */}
      {isOpen && (
        <aside className="ai-chat-panel animate-fade-in" role="dialog" aria-label="Luminary AI Concierge">
          <header className="ai-chat-header">
            <div className="ai-header-title-box">
              <span className="ai-star">✦</span>
              <div>
                <h3 className="ai-header-title">Luminary Concierge</h3>
                <span className="ai-header-status">Grounded in live catalog</span>
              </div>
            </div>
            <button 
              type="button" 
              className="ai-chat-close-btn" 
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </header>

          <div className="ai-chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-message-wrapper ${m.role}`}>
                <div className={`ai-bubble ${m.role}`}>
                  <p className="ai-bubble-text">{m.content}</p>
                </div>

                {/* Grounded Recommended Products from Chat */}
                {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                  <div className="ai-rec-products">
                    {m.recommendedProducts.map(p => {
                      const img = getProductImage(p);
                      return (
                        <div key={p.id} className="ai-product-card">
                          <img src={img} alt={p.name} className="ai-product-img" />
                          <div className="ai-product-details">
                            <h5 className="ai-product-title" onClick={() => onViewDetails && onViewDetails(p)}>
                              {p.name}
                            </h5>
                            <span className="ai-product-price">${Number(p.price).toFixed(2)}</span>
                            <div className="ai-product-btn-row">
                              <button 
                                type="button" 
                                className="ai-view-btn"
                                onClick={() => onViewDetails && onViewDetails(p)}
                              >
                                View
                              </button>
                              <button 
                                type="button" 
                                className="ai-add-btn"
                                onClick={() => onAddToCart && onAddToCart(p.id, 1)}
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-message-wrapper assistant">
                <div className="ai-bubble assistant ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && !loading && (
            <div className="ai-quick-prompts">
              <span className="ai-quick-title">Suggested prompts:</span>
              <div className="ai-quick-tags">
                {QUICK_PROMPTS.map((p, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    className="ai-quick-tag"
                    onClick={() => handleQuickPrompt(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form 
            className="ai-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input 
              ref={inputRef}
              type="text" 
              placeholder={currentUser ? "Ask about any product or setup..." : "Sign in to chat with AI..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !currentUser}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim() || !currentUser}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
