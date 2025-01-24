import * as React from "react";
import { InputFieldProps } from "./types";

export const InputField: React.FC<InputFieldProps> = ({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  rightIcon
}) => {
  return (
    <div className="flex gap-5 justify-between p-4 mt-5 w-full text-sm leading-loose text-gray-500 bg-white rounded-xl border border-solid border-stone-200 shadow-[19px_19px_37px_rgba(211,209,216,0.25)]">
      <div className="flex gap-3.5 self-start">
        <img
          loading="lazy"
          src={icon}
          alt=""
          className="object-contain shrink-0 aspect-square w-[22px]"
        />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="my-auto bg-transparent outline-none"
          aria-label={placeholder}
        />
      </div>
      {rightIcon && (
        <img
          loading="lazy"
          src={rightIcon}
          alt=""
          className="object-contain shrink-0 w-6 aspect-square"
        />
      )}
    </div>
  );
};