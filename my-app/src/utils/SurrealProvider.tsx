"use client";
import { Surreal } from "surrealdb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { authenticate, invalidateAuth } from "@/utils/RequestSurrealToken";
import { getCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";

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
  connect: () => Promise<boolean>;
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

  // React Query mutation for connecting to Surreal with your specific connection logic
  const {
    mutateAsync: connectMutation,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: async () => {
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
      try {
        if (sessionToken) {
          await surrealInstance.authenticate(sessionToken);
        } else {
          throw new Error("No session token found");
        }
      } catch {
        try {
          const token = await authenticate();
          await surrealInstance.authenticate(token.token);
        } catch {
          // On login page or when no authentication is available, don't throw error
          // Just close the connection and return false to indicate connection failed
          try {
            await surrealInstance.close();
          } catch {
            // Ignore close errors
          }
          return false;
        }
      }

      return true;
    },
  });

  // Wrap mutateAsync in a stable callback
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const result = await connectMutation();
      return result ?? false;
    } catch (err) {
      console.error("Failed to connect to SurrealDB:", err);
      return false;
    }
  }, [connectMutation]);

  // Wrap close() in a stable callback
  const close = useCallback(() => surrealInstance.close(), [surrealInstance]);

  // Logout helper
  const logout = useCallback(async () => {
    try {
      // Invalidate auth on the client and close connection
      try {
        // invalidate() clears the auth token on the Surreal client
        // It's safe to call even if not authenticated
        if (
          typeof (
            surrealInstance as unknown as { invalidate?: () => Promise<void> }
          ).invalidate === "function"
        ) {
          await (
            surrealInstance as unknown as { invalidate: () => Promise<void> }
          ).invalidate();
        }
      } catch (_) {
        // noop
      }
      try {
        await surrealInstance.close();
      } catch (_) {
        // noop
      }

      // Stop and clear all React Query caches
      try {
        await queryClient.cancelQueries();
      } catch (_) {
        // noop
      }
      queryClient.clear();

      // Clear cookies using server function (including httpOnly refresh cookie)
      try {
        await invalidateAuth();
      } catch (error) {
        console.error("Failed to clear cookies during logout:", error);
      }
    } finally {
      // Redirect to landing page
      router.replace("/");
    }
  }, [queryClient, router, surrealInstance]);

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    connect();

    return () => {
      reset();
      surrealInstance.close();
    };
  }, [connect, reset, surrealInstance]);

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
      isConnecting: isPending,
      isSuccess,
      isError,
      error,
      connect,
      close,
      logout,
    }),
    [
      surrealInstance,
      isPending,
      isSuccess,
      isError,
      error,
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
