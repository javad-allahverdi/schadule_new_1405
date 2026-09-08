// src/components/SimpleToast.jsx
import React, { useEffect, useState } from 'react';

export const toast = {
  messages: [],
  listeners: [],
  
  success(message) {
    this.addMessage(message, 'success');
  },
  
  error(message) {
    this.addMessage(message, 'error');
  },
  
  info(message) {
    this.addMessage(message, 'info');
  },
  
  addMessage(message, type) {
    const id = Date.now();
    this.messages.push({ id, message, type });
    this.notifyListeners();
    
    // حذف خودکار بعد از 3 ثانیه
    setTimeout(() => {
      this.messages = this.messages.filter(msg => msg.id !== id);
      this.notifyListeners();
    }, 3000);
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.messages));
  },
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

export default function SimpleToast() {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const unsubscribe = toast.subscribe(setMessages);
    return unsubscribe;
  }, []);
  
  if (messages.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg text-white max-w-md
            ${msg.type === 'success' ? 'bg-green-500' : ''}
            ${msg.type === 'error' ? 'bg-red-500' : ''}
            ${msg.type === 'info' ? 'bg-blue-500' : ''}
          `}
        >
          {msg.message}
        </div>
      ))}
    </div>
  );
}