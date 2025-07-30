import React from 'react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  // For react-hook-form compatibility
  ref?: React.Ref<HTMLSelectElement>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  required,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        value={value}
        required={required}
        className={clsx(
          'input',
          error && 'border-danger-500 focus-visible:ring-danger-500',
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {options.map((option, index) => {
          // Verificação de segurança para garantir que option.label seja uma string
          const label = typeof option.label === 'string' ? option.label : String(option.label || option.value);
          return (
            <option key={`${option.value}-${index}`} value={option.value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-sm text-danger-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select; 