import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  help,
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full h-10 px-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-base text-[var(--color-text-primary)] transition-all duration-150 placeholder:text-[var(--color-text-quaternary)]';
  const focusClasses = 'focus:outline-none focus:border-[var(--color-primary-400)] focus:shadow-[0_0_0_3px_rgba(86,186,125,0.1)]';
  const errorClasses = error ? 'border-[var(--color-error)]' : '';

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--color-error)] mt-1">{error}</p>
      )}
      {help && !error && (
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{help}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  help?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  help,
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full min-h-[80px] p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-base text-[var(--color-text-primary)] transition-all duration-150 placeholder:text-[var(--color-text-quaternary)] resize-vertical';
  const focusClasses = 'focus:outline-none focus:border-[var(--color-primary-400)] focus:shadow-[0_0_0_3px_rgba(86,186,125,0.1)]';
  const errorClasses = error ? 'border-[var(--color-error)]' : '';

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--color-error)] mt-1">{error}</p>
      )}
      {help && !error && (
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{help}</p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  help?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  help,
  options,
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full h-10 px-3 pr-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-base text-[var(--color-text-primary)] transition-all duration-150 appearance-none cursor-pointer';
  const focusClasses = 'focus:outline-none focus:border-[var(--color-primary-400)] focus:shadow-[0_0_0_3px_rgba(86,186,125,0.1)]';
  const errorClasses = error ? 'border-[var(--color-error)]' : '';
  const backgroundImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
          style={{
            backgroundImage,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '16px 16px'
          }}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)] mt-1">{error}</p>
      )}
      {help && !error && (
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{help}</p>
      )}
    </div>
  );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-opacity-20 ${className}`}
        {...props}
      />
      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    </label>
  );
};

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        className={`w-4 h-4 border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-opacity-20 ${className}`}
        {...props}
      />
      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    </label>
  );
};

// Form wrapper component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form: React.FC<FormProps> = ({ children, ...props }) => {
  return <form {...props}>{children}</form>;
};

export default Form;