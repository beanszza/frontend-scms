"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const apiAuth = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiAuth.post("/api/erp-auth/login", { username, password });

      if (!res || res.status !== 200) {
        throw new Error("Login failed. Please try again.");
      }

      const { mustChangePassword } = res.data;

      if (mustChangePassword) {
        router.push("/change-password");
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get("redirect");
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-foreground text-title-sm/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your username and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">

              {/* Username */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Username <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring focus:ring-ring/10/90"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-11 w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring focus:ring-ring/10/90 pr-12"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Keep me logged in + Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="keepLoggedIn"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-foreground focus:ring-ring cursor-pointer"
                  />
                  <label htmlFor="keepLoggedIn" className="block font-normal text-foreground text-sm cursor-pointer">
                    Keep me logged in
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error message */}
              <div>
                {error && (
                  <p className="mb-3 text-sm text-destructive">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-primary-foreground transition rounded-lg bg-primary shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
