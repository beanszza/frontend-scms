"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import apiAuth from "@/lib/api";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
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
      if (res.status === 200) {
        window.location.href = "/";
      } else {
        setError("Invalid credentials.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-white">
      {/* Left side form */}
      <div className="flex flex-col justify-center flex-1 px-8 sm:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Sign In</h1>
            <p className="mt-2 text-sm text-slate-400">Enter your username and password to sign in!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Username <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-semibold text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Right side banner */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12 border-l border-slate-800">
        <div className="text-center space-y-6 max-w-lg">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <span className="text-4xl font-black text-white">ERP</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Supply Chain Management System</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Real-time inventory velocity, production tracking, yield monitoring, and multi-facility distribution.</p>
        </div>
      </div>
    </div>
  );
}
