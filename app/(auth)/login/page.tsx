"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Info } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(() =>
    searchParams.get("reason") === "expired"
      ? "Your session has expired. Please log in again to continue."
      : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid username or password");
        setLoading(false);
        return;
      }

      // Success -> Redirect to Home Dashboard
      router.push("/home");
      router.refresh();
    } catch {
      setErrorMsg("Unable to connect to the authentication service. Please check your network.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-bg flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-panel-bg border border-line rounded-2xl shadow-xl overflow-hidden">
        {/* Header Block */}
        <div className="bg-ink p-8 text-center text-white relative">
          <div className="w-14 h-14 bg-amber/20 border border-amber/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-paper">
            SMI ERP
          </h1>
          <p className="text-xs text-[#a0aabf] mt-1 font-sans">
            Enterprise Industrial Operations Dashboard
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {/* Notifications */}
          {infoMsg && (
            <div className="p-3 bg-amber-soft/60 border border-amber/30 rounded-xl flex items-start gap-2.5 text-xs text-ink">
              <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-danger">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="font-semibold text-ink block">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-bg/50 border border-line rounded-lg text-ink font-medium focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="font-semibold text-ink block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-bg/50 border border-line rounded-lg text-ink font-medium focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Single Primary Amber Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber text-white font-semibold rounded-lg text-xs hover:bg-amber/90 focus:outline-none focus:ring-2 focus:ring-amber/50 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Demo Hint Banner */}
          <div className="p-3 bg-slate-bg border border-line rounded-xl text-[11px] text-ink-soft text-center leading-relaxed">
            <span className="font-semibold text-ink">Demo Credentials:</span>{" "}
            <code className="bg-panel-bg px-1.5 py-0.5 rounded border border-line font-mono text-ink">admin</code> /{" "}
            <code className="bg-panel-bg px-1.5 py-0.5 rounded border border-line font-mono text-ink">Demo@12345</code>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-soft mt-6 text-center">
        Protected system • SMI Industrial ERP • Production Build v1.0
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-bg flex items-center justify-center text-xs text-ink-soft">Loading authentication...</div>}>
      <LoginForm />
    </Suspense>
  );
}
