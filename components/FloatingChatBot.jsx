'use client';
import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, X, Sparkles, Bot, ChevronDown, Zap, RotateCcw, Store, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';

const BUYER_PROMPTS = [
  '🛍️ Find best deals',
  '📦 Track my order',
  '🎁 Gift ideas under ₹1000',
  '⭐ Top rated products',
];

const SELLER_PROMPTS = [
  '📝 Draft new product listing',
  '📦 Check inventory & stock',
  '💰 Pricing & margin tips',
  '📊 Store order summary',
];

export default function FloatingChatBot() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isSeller = role === 'seller';
  const effectiveRole = isSeller ? 'seller' : 'buyer';

  const defaultAssistantMessage = isSeller
    ? "👋 Hi! I'm your **Seller AI Assistant**. Ask me anything — draft product listings, manage inventory, check pricing insights, or track customer orders!"
    : "👋 Hi! I'm your **ShopEZ Shopping Assistant**. Ask me anything — find products, check deals, track orders, or get gift ideas!";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: defaultAssistantMessage,
    },
  ]);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync initial welcome message only on first mount or when chat is empty
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 1) return prev;
      return [
        {
          id: '0',
          role: 'assistant',
          content: isSeller
            ? "👋 Hi! I'm your **Seller AI Assistant**. Ask me anything — draft product listings, manage inventory, check pricing insights, or track customer orders!"
            : "👋 Hi! I'm your **ShopEZ Shopping Assistant**. Ask me anything — find products, check deals, track orders, or get gift ideas!",
        },
      ];
    });
  }, [isSeller]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async (text) => {
    const content = text || input;
    if (!content.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setTyping(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: effectiveRole, sessionId, messages: apiMessages }),
      });

      if (!res.ok) throw new Error('Agent error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      let pendingToolUse = '';
      let pendingToolResult = null;
      const assistantMsgId = (Date.now() + 1).toString();

      setTyping(false);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') break;
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'text') {
              assistantResponse += data.text;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== assistantMsgId);
                return [
                  ...filtered,
                  {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: assistantResponse,
                    toolUse: pendingToolUse,
                    toolResult: pendingToolResult,
                  },
                ];
              });
            } else if (data.type === 'tool_use') {
              pendingToolUse = data.name;
            } else if (data.type === 'tool_result') {
              pendingToolResult = data.result;
            }
          } catch (_) {}
        }
      }

      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ Sorry, something went wrong. Please try again!',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: defaultAssistantMessage,
      },
    ]);
    setInput('');
  };

  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const quickPrompts = isSeller ? SELLER_PROMPTS : BUYER_PROMPTS;
  const gradient = isSeller
    ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
    : 'linear-gradient(135deg, #6366f1, #a855f7)';

  // Hide on standalone Delivery Agent portal
  if (pathname.startsWith('/delivery')) {
    return null;
  }

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        id="ai-chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={isSeller ? 'Open Seller AI Assistant' : 'Open AI Shopping Assistant'}
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 1000,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: gradient,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isSeller
            ? '0 8px 32px rgba(139,92,246,0.45), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget).style.transform = 'scale(1.1)';
          (e.currentTarget).style.boxShadow = isSeller
            ? '0 12px 40px rgba(139,92,246,0.6), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 12px 40px rgba(99,102,241,0.6), 0 2px 8px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget).style.transform = 'scale(1)';
          (e.currentTarget).style.boxShadow = isSeller
            ? '0 8px 32px rgba(139,92,246,0.45), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.4)';
        }}
      >
        {open ? (
          <ChevronDown size={24} color="white" />
        ) : isSeller ? (
          <Store size={24} color="white" />
        ) : (
          <Sparkles size={24} color="white" />
        )}
        {unread > 0 && !open && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 20,
              height: 20,
              background: '#f43f5e',
              borderRadius: '50%',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-primary)',
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1.75rem',
          zIndex: 999,
          width: 390,
          maxWidth: 'calc(100vw - 2rem)',
          height: 570,
          maxHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 15, 26, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: isSeller ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(99,102,241,0.25)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: isSeller
              ? 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.12))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
            borderBottom: isSeller
              ? '1px solid rgba(139,92,246,0.25)'
              : '1px solid rgba(99,102,241,0.2)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSeller ? '0 0 20px rgba(139,92,246,0.5)' : '0 0 20px rgba(99,102,241,0.5)',
              }}
            >
              {isSeller ? <Store size={20} color="white" /> : <Sparkles size={20} color="white" />}
            </div>
            <span
              className="pulse-dot"
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                border: '2px solid rgba(10,15,26,0.97)',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSeller ? 'Seller AI Copilot' : 'ShopEZ AI'}
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 7px',
                  borderRadius: 999,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  background: isSeller ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
                  color: isSeller ? '#c084fc' : '#818cf8',
                  border: isSeller ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(99,102,241,0.4)',
                }}
              >
                {isSeller ? 'MERCHANT' : 'BUYER'}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              Online · MCP Powered
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={resetChat}
              title="Reset chat"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget).style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => ((e.currentTarget).style.color = 'var(--text-muted)')}
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget).style.color = '#f43f5e')}
              onMouseLeave={(e) => ((e.currentTarget).style.color = 'var(--text-muted)')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            scrollbarWidth: 'thin',
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginBottom: 2,
                      background: gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bot size={13} color="white" />
                  </div>
                  <div
                    style={{
                      background: 'rgba(17,24,39,0.9)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '0.65rem 0.9rem',
                      maxWidth: '85%',
                      fontSize: '0.875rem',
                      lineHeight: 1.55,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{renderContent(m.content)}</div>

                    {m.toolResult && m.toolUse === 'search_products' && m.toolResult.results && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {m.toolResult.results.slice(0, 3).map((prod, idx) => (
                          <div
                            key={prod._id || prod.product_id || prod.objectID || `prod_float_${idx}`}
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              background: 'rgba(13,20,36,0.8)',
                              padding: '0.5rem',
                              borderRadius: 10,
                              border: '1px solid rgba(99,102,241,0.15)',
                            }}
                          >
                            {prod.imageUrl && (
                              <img
                                src={prod.imageUrl}
                                alt={prod.title}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'cover',
                                  borderRadius: 7,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{prod.title}</div>
                              <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 700 }}>₹{prod.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {m.toolResult && m.toolUse === 'generate_listing_draft' && (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          padding: '0.6rem',
                          background: 'rgba(13,20,36,0.8)',
                          borderRadius: 10,
                          border: '1px solid rgba(245,158,11,0.2)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#f59e0b',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Sparkles size={12} /> AI Draft Generated
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: 3 }}>{m.toolResult.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {m.toolResult.description}
                        </div>
                        <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>
                          ₹{m.toolResult.suggested_price}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {m.role === 'user' && (
                <div
                  style={{
                    background: gradient,
                    borderRadius: '16px 16px 4px 16px',
                    padding: '0.65rem 0.9rem',
                    maxWidth: '80%',
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    color: 'white',
                  }}
                >
                  {m.content}
                </div>
              )}
            </div>
          ))}

          {(isLoading || typing) && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={13} color="white" />
              </div>
              <div
                style={{
                  background: 'rgba(17,24,39,0.9)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                }}
              >
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips — only on first message */}
        {messages.length === 1 && (
          <div style={{ padding: '0 1rem 0.5rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                style={{
                  background: isSeller ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.1)',
                  border: isSeller ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  color: isSeller ? '#c084fc' : 'var(--accent-bright)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.background = isSeller
                    ? 'rgba(139,92,246,0.25)'
                    : 'rgba(99,102,241,0.2)';
                  (e.currentTarget).style.borderColor = isSeller
                    ? 'rgba(139,92,246,0.6)'
                    : 'rgba(99,102,241,0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.background = isSeller
                    ? 'rgba(139,92,246,0.12)'
                    : 'rgba(99,102,241,0.1)';
                  (e.currentTarget).style.borderColor = isSeller
                    ? 'rgba(139,92,246,0.3)'
                    : 'rgba(99,102,241,0.25)';
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(99,102,241,0.15)',
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(8,12,20,0.6)',
          }}
        >
          <input
            ref={inputRef}
            id="ai-chat-input"
            type="text"
            className="input-field"
            placeholder={
              isSeller
                ? 'e.g. Draft listing for wireless earbuds at ₹1999...'
                : 'Ask me anything or find products...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            style={{
              background: 'rgba(13,20,36,0.8)',
              border: isSeller ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              fontSize: '0.875rem',
              padding: '0.55rem 0.875rem',
            }}
          />
          <button
            id="ai-chat-send"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="btn-glow"
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 12,
              flexShrink: 0,
              opacity: isLoading || !input.trim() ? 0.5 : 1,
              background: gradient,
            }}
          >
            <Send size={15} />
          </button>
        </div>

        {/* Powered-by footer */}
        <div
          style={{
            padding: '0.4rem 1rem 0.6rem',
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            background: 'rgba(8,12,20,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Zap size={10} color="var(--accent-bright)" fill="var(--accent-bright)" />
          {isSeller ? 'Powered by ShopEZ Merchant MCP' : 'Powered by ShopEZ MCP · Claude AI'}
        </div>
      </div>
    </>
  );
}

