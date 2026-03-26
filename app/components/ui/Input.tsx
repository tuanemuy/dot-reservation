import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className = "", error, ...props }: InputProps) {
  return (
    <input
      className={`w-full transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed h-11 px-4 font-body text-base font-normal rounded-md ${props.disabled ? "text-neutral-500 bg-neutral-100" : "text-neutral-900 bg-white"} ${error ? "border border-error" : "border border-neutral-300"} ${className}`}
      {...props}
    />
  );
}
