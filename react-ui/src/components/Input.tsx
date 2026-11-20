interface InputProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}

export default function Input({ label, name, type, placeholder = "" }: InputProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input type={type} name={name} placeholder={placeholder} className="w-full p-2 border border-gray-300 rounded-md" />
    </div>
  );
}