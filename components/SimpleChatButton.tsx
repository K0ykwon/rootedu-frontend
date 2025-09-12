'use client';

import { useState } from 'react';

export default function SimpleChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-[9999] border-2 border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-blue-500 text-white rounded-t-lg flex justify-between items-center">
          <span className="font-bold">Chat</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1 rounded"
          >
            ✕
          </button>
        </div>
        <div className="p-4 h-[calc(100%-60px)] flex items-center justify-center text-gray-500">
          Chat content here...
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl z-[9999] flex items-center justify-center transition-all transform hover:scale-110"
      aria-label="Open chat"
    >
      <svg 
        className="w-8 h-8" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
        />
      </svg>
    </button>
  );
}