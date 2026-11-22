import type { InputHTMLAttributes } from 'react';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> & {
  label: string;
  name: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
};

export default function Input({ label, name, type = 'text', className = '', ...inputProps }: InputProps) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <label htmlFor={name}>{label}</label>
      <input
        {...inputProps}
        id={name}
        name={name}
        type={type}
        className={`w-full rounded-md border border-gray-700 px-3 py-2 ${inputProps.disabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-transparent'} ${className}`}
      />
    </div>
  );
}
