"use client";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Surreal } from "surrealdb";
import { authenticate, invalidateAuth } from "@/utils/RequestSurrealToken";

interface SurrealProviderProps {
  children: React.ReactNode;
}

interface SurrealProviderState {
  /** The Surreal instance */
  client: Surreal;
  /** Whether the connection is pending */
  isConnecting: boolean;
  /** Whether the connection was successfully established */
  isSuccess: boolean;
  /** Whether the connection rejected in an error */
  isError: boolean;
  /** The connection error, if present */
  error: unknown;
  /** Connect to the Surreal instance */
  connect: (email?: string, password?: string) => Promise<boolean>;
  /** Close the Surreal instance */
  close: () => Promise<true>;
  /** Logout: invalidate session, clear cookies, and redirect */
  logout: () => Promise<void>;
}

const SurrealContext = createContext<SurrealProviderState | undefined>(
  undefined,
);

export function SurrealProvider({ children }: SurrealProviderProps) {
  // Surreal instance remains stable across re-renders
  const [surrealInstance] = useState(() => new Surreal());
  const queryClient = useQueryClient();
  const router = useRouter();

  // Simple state management for connection
  const [connectionState, setConnectionState] = useState({
    isConnecting: false,
    isSuccess: false,
    isError: false,
    error: null as unknown,
  });

  // Simplified connection logic
  const connectMutation = useCallback(
    async (email?: string, password?: string) => {
      if (
        !process.env.NEXT_PUBLIC_SURREAL_URL ||
        !process.env.NEXT_PUBLIC_SURREAL_NS ||
        !process.env.NEXT_PUBLIC_SURREAL_DB
      ) {
        throw new Error(
          "NEXT_PUBLIC_SURREAL_URL, NEXT_PUBLIC_SURREAL_NS, and NEXT_PUBLIC_SURREAL_DB environment variables must be set",
        );
      }

      const sessionToken: string | undefined = getCookie("surrealToken");

      await surrealInstance.connect(
        `wss://${process.env.NEXT_PUBLIC_SURREAL_URL}`,
        {
          namespace: process.env.NEXT_PUBLIC_SURREAL_NS,
          database: process.env.NEXT_PUBLIC_SURREAL_DB,
        },
      );

      // Try to authenticate with existing token first
      if (sessionToken) {
        await surrealInstance.authenticate(sessionToken);
      } else {
        // If no token, authenticate to get one (with optional credentials)
        const token = await authenticate(email, password);
        await surrealInstance.authenticate(token.token);
      }

      return true;
    },
    [surrealInstance],
  );

  // Simplified connect function
  const connect = useCallback(
    async (email?: string, password?: string): Promise<boolean> => {
      setConnectionState({
        isConnecting: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      try {
        await connectMutation(email, password);
        setConnectionState({
          isConnecting: false,
          isSuccess: true,
          isError: false,
          error: null,
        });
        return true;
      } catch (err) {
        setConnectionState({
          isConnecting: false,
          isSuccess: false,
          isError: true,
          error: err,
        });
        console.error("Failed to connect to SurrealDB:", err);
        return false;
      }
    },
    [connectMutation],
  );

  // Wrap close() in a stable callback
  const close = useCallback(() => surrealInstance.close(), [surrealInstance]);

  // Simplified logout helper
  const logout = useCallback(async () => {
    // Invalidate auth and close connection
    await surrealInstance.invalidate?.();
    await surrealInstance.close();

    // Clear React Query cache
    queryClient.clear();

    // Clear cookies and redirect
    await invalidateAuth();
    router.replace("/");
  }, [queryClient, router, surrealInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      surrealInstance.close();
    };
  }, [surrealInstance]);

  // Removed: If connection failed, redirect to home
  // useEffect(() => {
  //   if (isError) {
  //     router.replace("/");
  //   }
  // }, [isError, router]);

  // Memoize the context value
  const value: SurrealProviderState = useMemo(
    () => ({
      client: surrealInstance,
      isConnecting: connectionState.isConnecting,
      isSuccess: connectionState.isSuccess,
      isError: connectionState.isError,
      error: connectionState.error,
      connect,
      close,
      logout,
    }),
    [
      surrealInstance,
      connectionState.isConnecting,
      connectionState.isSuccess,
      connectionState.isError,
      connectionState.error,
      connect,
      close,
      logout,
    ],
  );

  return (
    <SurrealContext.Provider value={value}>{children}</SurrealContext.Provider>
  );
}

/**
 * Access the Surreal connection state from the context.
 */
export function useSurreal() {
  const context = useContext(SurrealContext);
  if (!context) {
    throw new Error("useSurreal must be used within a SurrealProvider");
  }
  return context;
}

/**
 * Access the Surreal client from the context.
 */
export function useSurrealClient() {
  const { client } = useSurreal();
  return client;
}
