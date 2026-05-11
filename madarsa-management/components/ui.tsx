
import React, { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

// --- Button ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  startIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, variant = 'contained', color = 'primary', size = 'md', className = '', startIcon, fullWidth, ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 uppercase tracking-wider shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    contained: {
      primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-md active:shadow-sm focus:ring-primary-500",
      secondary: "bg-secondary-500 hover:bg-secondary-600 text-white shadow-md active:shadow-sm focus:ring-secondary-500",
      danger: "bg-red-600 hover:bg-red-700 text-white shadow-md active:shadow-sm focus:ring-red-500",
      success: "bg-green-600 hover:bg-green-700 text-white shadow-md active:shadow-sm focus:ring-green-500",
    },
    outlined: {
      primary: "border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
      secondary: "border border-secondary-500 text-secondary-500 hover:bg-secondary-50 focus:ring-secondary-500",
      danger: "border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500",
      success: "border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500",
    },
    text: {
      primary: "text-primary-600 hover:bg-primary-50 focus:ring-primary-500 shadow-none",
      secondary: "text-secondary-500 hover:bg-secondary-50 focus:ring-secondary-500 shadow-none",
      danger: "text-red-600 hover:bg-red-50 focus:ring-red-500 shadow-none",
      success: "text-green-600 hover:bg-green-50 focus:ring-green-500 shadow-none",
    }
  };

  const colorStyles = variants[variant][color];
  const currentSizeStyle = sizeStyles[size];
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button ref={ref} className={`${baseStyles} ${currentSizeStyle} ${colorStyles} ${widthStyles} ${className}`} {...props}>
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
    </button>
  );
});
Button.displayName = "Button";

// --- TextField (Input) ---
// Added fullWidth to TextFieldProps
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  helperText?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

// Updated TextField to accept fullWidth and apply it to the container
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({ 
  label, error, helperText, className = '', icon: Icon, fullWidth, ...props 
}, ref) => {
  return (
    <div className={`relative mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        placeholder=" " 
        className={`peer w-full h-12 bg-transparent text-gray-900 dark:text-gray-100 placeholder-transparent border-b-2 
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
          focus:outline-none focus:border-primary-500 
          ${Icon ? 'pl-10' : 'pl-1'}`}
        {...props}
      />
      <label 
        className={`absolute left-0 -top-3.5 text-gray-600 dark:text-gray-400 text-xs transition-all 
          peer-placeholder-shown:text-base peer-placeholder-shown:top-3 
          ${Icon ? 'peer-placeholder-shown:left-10' : 'peer-placeholder-shown:left-1'}
          peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-500 peer-focus:left-0 cursor-text
          ${error ? 'text-red-500 peer-focus:text-red-500' : ''}`}
      >
        {label}
      </label>
      {helperText && (
        <p className={`text-xs mt-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>{helperText}</p>
      )}
    </div>
  );
});
TextField.displayName = "TextField";

// --- Card ---
export const Card: React.FC<{ children?: ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${className}`}>
    {children}
  </div>
);

// --- Table Components ---
export const TableContainer: React.FC<{ children?: ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 ${className}`}>
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
      {children}
    </table>
  </div>
);

export const TableHead: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <thead className="bg-gray-50 dark:bg-gray-700">
    {children}
  </thead>
);

export const TableRow: React.FC<{ children?: ReactNode, className?: string } & React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className='', ...props }) => (
  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeaderCell: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
    {children}
  </th>
);

// Updated TableCell to support standard td attributes like colSpan
export const TableCell: React.FC<{ children?: ReactNode, className?: string } & React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 ${className}`} {...props}>
    {children}
  </td>
);

// --- Badge ---
interface BadgeProps { 
  children?: ReactNode; 
  color?: 'blue'|'green'|'red'|'yellow'|'purple'; 
}
export const Badge: React.FC<BadgeProps> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

// --- Checkbox ---
export const Checkbox = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    type="checkbox" 
    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer" 
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
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
            <div className="mt-2">
              {children}
            </div>
          </div>
          {actions && (
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
