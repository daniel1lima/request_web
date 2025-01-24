import * as React from "react";
import { InputField } from "../../components/inputField";
import { SocialLoginButton } from "../../components/socialLoginButton";

export const SignInPage: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col px-7 pt-3.5 pb-10 mx-auto w-full bg-white max-w-[480px]">
      

      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/5259637880a03ef60796f6a83cb6dc428a66a35de0f5164761221677f456bd98?placeholderIfAbsent=true&apiKey=75942211a1544d86b498ed7135a3be3b"
        alt=""
        className="object-contain self-center mt-5 max-w-full aspect-[0.92] w-[142px]"
      />
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f1649754e2decbcdeb28d5cd90d20e06bc791e6dbf881c6696420fa4fcf2c036?placeholderIfAbsent=true&apiKey=75942211a1544d86b498ed7135a3be3b"
        alt=""
        className="object-contain w-0"
      />

      <h1 className="self-start mt-3 text-2xl text-gray-900">Sign in</h1>

      <form>
        <InputField
          icon="https://cdn.builder.io/api/v1/image/assets/TEMP/43d564d7d5c8b0b3cca44340309518d7a1bac15e870a3a74d82d1d67ebf96c7b?placeholderIfAbsent=true&apiKey=75942211a1544d86b498ed7135a3be3b"
          placeholder="abc@email.com"
          type="email"
        />
        <InputField
          icon="https://cdn.builder.io/api/v1/image/assets/TEMP/ddb150c3c9a90c166d408a8c1ad8525704a46f4155765ac7a57c7481025c0576?placeholderIfAbsent=true&apiKey=75942211a1544d86b498ed7135a3be3b"
          placeholder="Your password"
          type="password"
          rightIcon="https://cdn.builder.io/api/v1/image/assets/TEMP/532707a848974b6f2ba806edad8a2bc73964463c092a9073bea5c8cf54265f18?placeholderIfAbsent=true&apiKey=75942211a1544d86b498ed7135a3be3b"
        />

        <div className="flex gap-5 justify-between self-end mt-5 w-full text-sm leading-loose text-right text-gray-900 max-w-[276px]">
          <label className="cursor-pointer">
            <input type="checkbox" className="sr-only" />
            <span>Remember Me</span>
          </label>
          <button type="button">Forgot Password?</button>
        </div>

        <button
          type="submit"
          className="self-center px-16 py-5 mt-9 w-full text-base tracking-wider text-center text-white uppercase bg-indigo-500 rounded-2xl fill-indigo-500 max-w-[271px] shadow-[0px_10px_35px_rgba(111,126,201,0.25)]"
        >
          Sign in
        </button>
      </form>

      <div className="self-center mt-6 text-base font-medium leading-9 text-center text-stone-400">
        OR
      </div>

      <SocialLoginButton provider="Google" className="w-[273px] mt-1.5" />
      <SocialLoginButton provider="Facebook" className="w-[275px]" />

      <div className="self-center mt-5 text-base leading-loose text-center text-indigo-500">
        Don't have an account?{" "}
        <button type="button" className="text-indigo-500">
          Sign up
        </button>
      </div>
    </div>
  );
};