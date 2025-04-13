import React from "react";

interface ButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function Button({
  onClick,
  icon,
  className = "bg-gray-600",
  children,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
