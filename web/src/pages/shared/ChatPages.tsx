import React from 'react';
import {
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';
import { OrderChatView } from '../../components/orders/OrderChatView';

interface ChatPagesProps {
  chatId?: string;
  onNavigate: (path: string) => void;
}

export const ChatPages: React.FC<ChatPagesProps> = ({ chatId, onNavigate }) => {
  const { chats } = useWebApp();
  const chatList = Object.values(chats);

  // When viewing a specific order chat, render the unified OrderChatView
  if (chatId) {
    return <OrderChatView orderId={chatId} onNavigate={onNavigate} />;
  }

  // Chat Conversations List View `/app/chat`
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
};

export default ChatPages;
