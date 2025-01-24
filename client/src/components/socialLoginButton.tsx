import * as React from "react";
import { SocialLoginButtonProps } from "./types";

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  className
}) => {
  return (
    <button
      className={`self-center px-14 py-4 mt-4 max-w-full text-base leading-loose text-center text-gray-900 bg-white rounded-xl shadow-sm ${className}`}
    >
      Login with {provider}
    </button>
  );
};