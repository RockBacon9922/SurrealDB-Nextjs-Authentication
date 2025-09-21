"use client";

import { useSurreal } from "@/utils/SurrealProvider";

export function Dashboard() {
  const { logout, isConnecting } = useSurreal();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isConnecting}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? "Logging out..." : "Log Out"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome to SurrealDB!</h2>
        <p className="text-gray-600 mb-4">
          You are successfully connected to your SurrealDB instance. This is a
          simple example showing how to authenticate and maintain a connection.
        </p>

        <div className="bg-gray-50 p-4 rounded border">
          <h3 className="font-medium mb-2">Connection Status</h3>
          <p className="text-sm text-gray-600">
            Client is ready to execute queries against your database.
          </p>
        </div>
      </div>
    </div>
  );
}
