'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle2, AlertCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AgentChat({ role, productId, initialMessage, onActionComplete }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        role === 'seller'
          ? "👋 Hi! I'm your Seller Agent. Upload a product image or paste a product URL to generate an instant, complete listing!"
          : "👋 Hi! I'm your ShopEZ Shopping Assistant. Ask me anything about products, finding gifts, or checking out!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const messageContent = textToSend || input;
    if (!messageContent.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          sessionId,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to connect to agent');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      let pendingToolUse = '';
      let pendingToolResult = null;

      const assistantMsgId = (Date.now() + 1).toString();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
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
                if (onActionComplete) {
                  onActionComplete(data.name, data.result);
                }
              }
            } catch (e) {
              // Ignore non-JSON chunks
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue: ${err.message || 'Server error'}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '550px', padding: '1rem', border: '1px solid var(--border-bright)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{role === 'seller' ? 'Seller AI Assistant' : 'Shopping Concierge'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="pulse-dot"></span> Online (MCP Powered)
            </div>
          </div>
        </div>
        <span className="badge badge-published">{role.toUpperCase()}</span>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

              {/* Render dynamic Tool Result Cards */}
              {m.toolResult && m.toolUse === 'generate_listing_draft' && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={14} /> AI Draft Generated
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 4 }}>{m.toolResult.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{m.toolResult.description}</div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-published">₹{m.toolResult.suggested_price}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {m.toolResult.category}</span>
                  </div>
                </div>
              )}

              {m.toolResult && m.toolUse === 'search_products' && m.toolResult.results && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {m.toolResult.results.slice(0, 3).map((prod, idx) => (
                    <div key={prod._id || prod.product_id || prod.objectID || `prod_${idx}`} style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {prod.imageUrl && (
                        <img src={prod.imageUrl} alt={prod.title} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{prod.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', fontWeight: 700 }}>₹{prod.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {m.toolResult && m.toolUse === 'publish_listing' && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--emerald)', borderRadius: 'var(--radius)', color: 'var(--emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Listing Published! ID: {m.toolResult.product_id}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem', color: 'var(--text-muted)' }}>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <span style={{ fontSize: '0.8rem' }}>AI thinking & querying MCP tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder={role === 'seller' ? 'e.g. List this blue nike running shoe at ₹2499...' : 'e.g. Find me running shoes under ₹3000...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button className="btn-glow" onClick={() => handleSend()} disabled={isLoading || !input.trim()} style={{ padding: '0.625rem 1rem' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
