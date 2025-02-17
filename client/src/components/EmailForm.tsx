"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {submitEmailToWaitlist} from "../api/apiService"

export default function EmailForm() {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitEmailToWaitlist({
        email,
        eventId: '',
        songRequested: '',
      })

      if (response) {
        setEmail("");
        toast.success("Thank you for joining our waitlist! 🚀");
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Failed to join waitlist. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Email already exists in waitlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} method="POST" className="mt-2 max-w-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="sr-only" htmlFor="email-address">
            Email address
          </label>
          <input
            autoComplete="email"
            className="text-black block h-12 w-full focus:invalid:border-red-400 focus:invalid:text-red-500 focus:invalid:ring-red-500 appearance-none rounded-lg border-2 border-green-300 px-4 py-3 duration-200 focus:outline-none focus:ring-zinc-300 sm:text-md "
            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            id="email-address"
            name="email"
            placeholder="johndoe@example.com"
            required
            type="email"
            value={email}
            onChange={handleEmailChange}
          />
          <button
            className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#000F2D] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Submitting..." : "Join the waitlist"}</span>
          </button>
        </div>
      </form>
    </>
  );
}
