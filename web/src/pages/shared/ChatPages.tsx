import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Phone,
  Send,
  Camera,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';
import { ChatMessage } from '../../types';

interface ChatPagesProps {
  chatId?: string;
  onNavigate: (path: string) => void;
}

export const ChatPages: React.FC<ChatPagesProps> = ({ chatId, onNavigate }) => {
  const { chats, sendMessage, role, currentUser } = useWebApp();
  const chatList = Object.values(chats);
  const currentChat = chatId
    ? chats[chatId] || Object.values(chats).find((c) => c.orderId === chatId)
    : null;

  const [inputText, setInputText] = useState('');
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const messages = currentChat?.messages || [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentChat) return;
    sendMessage(currentChat.orderId, inputText.trim());
    setInputText('');
  };

  if (chatId && !currentChat) {
    return (
      <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-center text-neutral-secondary">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
          Conversation Not Found
        </h2>
        <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
          This order chat is not active or has ended.
        </p>
        <button
          onClick={() => onNavigate('/app/chat')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-indigo text-white text-xs font-semibold shadow-sm hover:bg-brand-indigo-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Messages</span>
        </button>
      </div>
    );
  }

  // If on list view `/app/chat`
  if (!chatId) {
    return (
      <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
            Messages & Chats
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Order-specific alias conversations. Phone numbers remain masked.
          </p>
        </div>

        <div className="space-y-3">
          {chatList.length === 0 ? (
            <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
              <MessageSquare className="w-10 h-10 text-neutral-placeholder mx-auto" />
              <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
                No active conversations
              </h3>
              <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
                Order chats will automatically appear here once an errand request is accepted by a verified campus helper.
              </p>
            </div>
          ) : (
            chatList.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onNavigate(`/app/chat/${chat.orderId}`)}
              className="p-4 sm:p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative w-11 h-11 rounded-full bg-brand-indigo-light text-brand-indigo flex items-center justify-center font-bold text-sm shrink-0">
                  {chat.counterpartName.slice(0, 1)}
                  {chat.unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-brand-coral border-2 border-white" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-indigo transition-colors">
                      {chat.counterpartName}
                    </h3>
                    <span className="text-xs font-mono text-neutral-secondary">
                      #{chat.orderId}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-secondary line-clamp-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-neutral-placeholder block">
                  {chat.lastMessageTime}
                </span>
                <span className="text-xs text-brand-indigo dark:text-brand-indigo-darkmode font-medium flex items-center justify-end gap-1 mt-1">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    );
  }

  // Chat Detail View `/app/chat/:id`
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <button
        onClick={() => onNavigate('/app/chat')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Messages</span>
      </button>

      {/* Pinned Order Summary & Privacy Notice (Section 8) */}
      <div className="p-4 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-border dark:border-slate-800">
          <div>
            <span className="font-heading font-bold text-sm text-neutral-ink dark:text-neutral-dark-text block">
              {currentChat?.counterpartName}
            </span>
            <span className="text-xs text-neutral-secondary font-mono">
              Linked to Order #{chatId}
            </span>
          </div>

          <button
            onClick={() => onNavigate(`/app/orders/${chatId}`)}
            className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
          >
            View Full Order Details →
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-secondary">
            <Lock className="w-3.5 h-3.5 text-brand-indigo" />
            <span>Phone numbers hidden for student protection.</span>
          </div>

          {!phoneRevealed ? (
            <button
              onClick={() => setPhoneRevealed(true)}
              className="text-xs font-semibold text-brand-indigo hover:underline flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" /> Reveal Phone Number
            </button>
          ) : (
            <span className="text-xs font-mono font-bold text-emerald-600">
              +91 98451 XXXXX
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="h-96 overflow-y-auto p-4 rounded-panel bg-white dark:bg-slate-900 border border-neutral-border dark:border-slate-800 space-y-3">
        {messages.map((m) => {
          if (m.isSystemNotice) {
            return (
              <div key={m.id} className="text-center my-2">
                <span className="inline-block px-3 py-1 rounded-full bg-neutral-surface-alt dark:bg-slate-800 text-[11px] text-neutral-secondary border border-neutral-border/60">
                  {m.text}
                </span>
              </div>
            );
          }

          const isMe = m.senderRole === 'customer';
          return (
            <div
              key={m.id}
              className={`flex flex-col chat-msg-enter ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-neutral-placeholder mb-0.5 px-1">
                {m.senderName} • {m.timestamp}
              </span>
              <div
                className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                  isMe
                    ? 'bg-brand-indigo text-white rounded-tr-sm'
                    : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text border rounded-tl-sm'
                }`}
              >
                <p>{m.text}</p>
                {m.qrCodeUrl && (
                  <div className="mt-2 p-2 bg-white rounded-lg shadow-sm">
                    <img
                      src={m.qrCodeUrl}
                      alt="Shop payment QR"
                      className="w-36 h-36 object-cover rounded mx-auto thumbnail-blur-up"
                    />
                    <span className="text-[10px] text-neutral-secondary text-center block mt-1">
                      Shop Cashier UPI Standee
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Section 10.4: Typing dots pulse indicator */}
        <div className="flex items-center gap-1.5 p-2 px-3 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 w-fit">
          <span className="text-[10px] text-neutral-secondary mr-1">Helper is active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-3" />
        </div>
      </div>

      {/* Message Input or Read-Only Notice */}
      {currentChat?.isReadOnly ? (
        <div className="p-3 text-center rounded-card bg-neutral-surface-alt text-xs text-neutral-secondary border">
          🔒 Order completed. Chat transcript is now in read-only mode.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo"
          />
          <button
            type="submit"
            className="h-11 px-4 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.97] transition-all duration-150 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      )}
    </div>
  );
};
