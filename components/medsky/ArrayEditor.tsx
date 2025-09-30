'use client';

import React from 'react';

interface ArrayEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  addButtonText?: string;
  removeButtonText?: string;
}

export function ArrayEditor({
  label,
  items,
  onChange,
  placeholder = '입력하세요',
  multiline = false,
  addButtonText = '+ 추가',
  removeButtonText = '삭제'
}: ArrayEditorProps) {
  const handleItemChange = (index: number, value: string) => {
    const newItems = items.map((item, i) => i === index ? value : item);
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([...items, '']);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      // Prevent removing the last item - just clear it instead
      onChange(['']);
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            {multiline ? (
              <textarea
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={placeholder}
                rows={2}
              />
            ) : (
              <input
                type="text"
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={placeholder}
              />
            )}
            <button
              onClick={() => handleRemoveItem(index)}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              type="button"
            >
              {removeButtonText}
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddItem}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        type="button"
      >
        {addButtonText}
      </button>
    </div>
  );
}