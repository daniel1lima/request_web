"use client";

import { Button } from "@/components/button";
import React, { useEffect } from "react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { cancelRequest } from "@/api/apiService";
import { useRouter, useSearchParams } from "next/navigation";

const Index: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
      const reqId = searchParams.get("requestId") || ''
      const pi = searchParams.get("pi") || ''

    if (!reqId || !pi) {
      router.push("/404");
    }

    cancelRequest(reqId, pi);
  });

  return (
    <div className="text-white bg-gray-900 dark:bg-gray-900 w-screen h-screen flex flex-col gap-10 items-center justify-center text-center">
      <p className="text-xl text-white">
        Your request has been cancelled succesfully!
      </p>
      <FaCheck size={60} />
      <Link href="/">
        <Button className="bg-white text-black mr-1">Take me back</Button>
      </Link>
    </div>
  );
};

export default Index;
