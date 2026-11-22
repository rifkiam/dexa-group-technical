import type { HTMLInputTypeAttribute } from "react";

interface InputProps {
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  accept?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
}

export default function Input({ label, name, type = "text", accept, placeholder = "", required = false, value }: InputProps) {
  return (
    <div className="flex flex-col text-left gap-1">
      <label htmlFor={name}>{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-700 rounded-md"
        required={required}
        accept={accept}
        value={value} />
    </div>
  );
}