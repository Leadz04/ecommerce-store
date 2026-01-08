'use client';

import { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  imageUrl?: string;
  description?: string;
}

interface SelectFieldProps {
  label?: string;
  options: SelectOption[];
  value: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function SelectField({
  label,
  options,
  value,
  isOpen,
  onOpenChange,
  onSelect,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  required = false,
}: SelectFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onOpenChange]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && onOpenChange(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
          }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selected?.imageUrl && (
            <img src={selected.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover flex-shrink-0" />
          )}
          <span className={`truncate text-left ${!selected ? 'text-gray-500' : ''}`}>
            {selected?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-xl">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-3 ${isSelected
                    ? 'bg-purple-50 text-purple-900 border-l-4 border-purple-500'
                    : 'text-gray-900 hover:bg-purple-50'
                    }`}
                >
                  {option.imageUrl && (
                    <img src={option.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-100 shadow-sm" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-[10px] text-gray-500 truncate">{option.description}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

