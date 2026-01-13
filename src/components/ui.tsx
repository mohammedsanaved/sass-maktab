import React, {
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
  forwardRef,
} from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

// --- Button ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  startIcon?: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'contained',
      color = 'primary',
      size = 'md',
      className = '',
      startIcon,
      fullWidth,
      isLoading,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variants = {
      contained: {
        primary:
          'bg-primary-100 hover:bg-primary-700 text-white shadow-md active:shadow-sm',
        secondary:
          'bg-secondary-500 hover:bg-secondary-600 text-white shadow-md active:shadow-sm focus:ring-secondary-500',
        danger:
          'bg-red-600 hover:bg-red-700 text-white shadow-md active:shadow-sm focus:ring-red-500',
        success:
          'bg-green-600 hover:bg-green-700 text-white shadow-md active:shadow-sm focus:ring-green-500',
      },
      outlined: {
        primary:
          'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
        secondary:
          'border border-secondary-500 text-secondary-500 hover:bg-secondary-50 focus:ring-secondary-500',
        danger:
          'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
        success:
          'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      },
      text: {
        primary:
          'text-primary-500 hover:bg-primary-100 focus:ring-primary-500 shadow-none',
        secondary:
          'text-secondary-500 hover:bg-secondary-50 focus:ring-secondary-500 shadow-none',
        danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500 shadow-none',
        success:
          'text-green-600 hover:bg-green-50 focus:ring-green-500 shadow-none',
      },
    };

    const colorStyles = variants[variant][color];
    const currentSizeStyle = sizeStyles[size];
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${currentSizeStyle} ${colorStyles} ${widthStyles} ${className}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {!isLoading && startIcon && <span className='mr-2'>{startIcon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// --- TextField (Input) ---
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helperText?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      icon: Icon,
      fullWidth,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={`relative mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {Icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          placeholder=' '
          className={`peer w-full h-12 bg-transparent text-foreground placeholder-transparent border-b-2 
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
          focus:outline-none focus:border-primary-500 
          ${Icon ? 'pl-10' : 'pl-1'}`}
          {...props}
        />
        <label
          className={`absolute left-0 -top-3.5 text-gray-600 dark:text-gray-400 text-xs transition-all 
          peer-placeholder-shown:text-base peer-placeholder-shown:top-3 
          ${
            Icon
              ? 'peer-placeholder-shown:left-10'
              : 'peer-placeholder-shown:left-1'
          }
          peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-500 peer-focus:left-0 cursor-text
          ${error ? 'text-red-500 peer-focus:text-red-500' : ''}`}
        >
          {label}
        </label>
        {helperText && (
          <p
            className={`text-xs mt-1 ${
              error ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = 'TextField';

// --- TimeInput (12-hour format with AM/PM) ---
interface TimeInputProps {
  label: string;
  value: string; // Expected format: "HH:mm" (24-hour)
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  className?: string;
  placeholder?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  className = '',
  placeholder = '09:00 AM',
}) => {
  // Convert 24-hour to 12-hour format
  const convertTo12Hour = (time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    if (!time24) return { hour: '', minute: '', period: 'AM' };
    
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    return {
      hour: hour12.toString(),
      minute: minutes || '00',
      period,
    };
  };

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
    // Allow empty values - don't convert until both are filled
    if (!hour && !minute) return '';
    
    // Default empty values to allow partial input
    const hourValue = hour || '12';
    const minuteValue = minute || '00';
    
    let hour24 = parseInt(hourValue, 10);
    
    // Handle invalid numbers
    if (isNaN(hour24)) return '';
    
    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minuteValue.padStart(2, '0')}`;
  };

  const { hour, minute, period } = convertTo12Hour(value);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHour = e.target.value;
    
    // Allow empty or valid hour (1-12)
    if (newHour === '') {
      onChange(''); // Clear the value
      return;
    }
    
    const hourNum = parseInt(newHour, 10);
    
    // Validate hour (1-12)
    if (hourNum >= 1 && hourNum <= 12) {
      const time24 = convertTo24Hour(newHour, minute || '00', period);
      onChange(time24);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinute = e.target.value;
    
    // Allow empty or valid minute (0-59)
    if (newMinute === '') {
      // Keep hour but clear minute
      const time24 = convertTo24Hour(hour || '12', '00', period);
      onChange(time24);
      return;
    }
    
    const minuteNum = parseInt(newMinute, 10);
    
    // Validate minute (0-59)
    if (minuteNum >= 0 && minuteNum <= 59) {
      const time24 = convertTo24Hour(hour || '12', newMinute, period);
      onChange(time24);
    }
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    const time24 = convertTo24Hour(hour || '12', minute || '00', newPeriod);
    onChange(time24);
  };

  return (
    <div className={`relative mb-4 ${className}`}>
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        {/* Hour Input */}
        <input
          type="number"
          min="1"
          max="12"
          value={hour}
          onChange={handleHourChange}
          placeholder="09"
          className={`w-16 h-12 px-3 text-center bg-transparent text-foreground border-b-2 
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
            focus:outline-none focus:border-primary-500`}
        />
        <span className="text-foreground text-xl font-bold">:</span>
        {/* Minute Input */}
        <input
          type="number"
          min="0"
          max="59"
          value={minute}
          onChange={handleMinuteChange}
          placeholder="00"
          className={`w-16 h-12 px-3 text-center bg-transparent text-foreground border-b-2 
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
            focus:outline-none focus:border-primary-500`}
        />
        {/* AM/PM Toggle */}
        <div className="flex border-b-2 border-gray-300 dark:border-gray-600 h-12">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              period === 'AM'
                ? 'bg-primary-500 text-white'
                : 'bg-transparent text-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              period === 'PM'
                ? 'bg-primary-500 text-white'
                : 'bg-transparent text-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            PM
          </button>
        </div>
      </div>
      {helperText && (
        <p className={`text-xs mt-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// --- Card ---
interface CardProps {
  children?: ReactNode;
  className?: string;
  variant?: 'standard' | 'neubrutal';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'standard',
}) => {
  const baseStyles =
    variant === 'neubrutal'
      ? 'neubrutal-card'
      : 'bg-background rounded-xl shadow-md';

  return <div className={`${baseStyles} p-6 ${className}`}>{children}</div>;
};

// --- Table Components ---
export const Table: React.FC<{ children?: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`overflow-x-auto rounded-lg shadow border border-primary-700 ${className}`}
  >
    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-background'>
      {children}
    </table>
  </div>
);

export const TableHead: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <thead className='text-foreground font-semibold'>{children}</thead>
);

export const TableBody: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <tbody className='bg-background'>{children}</tbody>
);

export const TableRow: React.FC<
  {
    children?: ReactNode;
    className?: string;
  } & React.HTMLAttributes<HTMLTableRowElement>
> = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const Th: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <th className='px-6 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide'>
    {children}
  </th>
);

export const TableCell: React.FC<
  {
    children?: ReactNode;
    className?: string;
  } & React.TdHTMLAttributes<HTMLTableCellElement>
> = ({ children, className = '', ...props }) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-sm text-foreground ${className}`}
    {...props}
  >
    {children}
  </td>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, className = '', ...props }, ref) => {
    const baseStyles =
      'w-full h-12 px-3 py-2 bg-background border border-gray-300 border-primary-500 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm';

    return (
      <select ref={ref} className={`${baseStyles} ${className}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

// --- Badge ---
interface BadgeProps {
  children?: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'blue',
  size = 'md',
  variant = 'soft',
}) => {
  const variants = {
    soft: {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
    solid: {
      blue: 'bg-blue-600 text-white',
      green: 'bg-green-600 text-white',
      red: 'bg-red-600 text-white',
      yellow: 'bg-yellow-600 text-white',
      purple: 'bg-purple-600 text-white',
    },
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={`${sizes[size]} inline-flex leading-5 font-semibold rounded-full ${variants[variant][color]}`}
    >
      {children}
    </span>
  );
};

// --- Checkbox ---
export const Checkbox = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type='checkbox'
    className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer'
    {...props}
  />
);

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6'>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal Content container to handle centering and sizing */}
      <div className='relative bg-background rounded-xl shadow-2xl transform transition-all sm:max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]'>
        <div className='px-6 pt-6 pb-4 overflow-y-auto'>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
            {title}
          </h3>
          <div className='mt-4'>{children}</div>
        </div>
        {actions && (
          <div className='bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 dark:border-gray-700'>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
