"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSurreal } from "@/utils/SurrealProvider";

export function LoginForm() {
  const { connect, isConnecting, isSuccess, isError, error } = useSurreal();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await connect(email, password);
  };

  // Redirect to dashboard when login is successful
  useEffect(() => {
    if (isSuccess) {
      router.push("/dashboard");
    }
  }, [isSuccess, router]);

  // Don't render anything while redirecting
  if (isSuccess) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Redirecting...
        </h2>
        <p>You are being redirected to your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Log In</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting..." : "Log In"}
        </button>
      </form>

      {isError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>
            Connection failed:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      )}
    </div>
  );
}
