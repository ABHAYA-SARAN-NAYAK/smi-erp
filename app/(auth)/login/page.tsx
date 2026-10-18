"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, Loader2, Info } from "lucide-react";

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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121317] bg-cover bg-center bg-fixed p-4 text-[#E9ECEF]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(9, 14, 19, 0.3), rgba(9, 14, 19, 0.3)), url(https://res.cloudinary.com/dkht5j3tw/image/upload/v1792312469/Cinematic_Teal-Orange_Machine_Shop_un1pjv.png)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(94, 234, 212, 0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(94, 234, 212, 0.45) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-[22px] border border-[#FB5607]/45 bg-[rgba(18,19,23,0.92)] p-5 shadow-[0_0_34px_rgba(251,86,7,0.18),0_20px_56px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7">
        <div className="text-center">
          <img
            src="https://res.cloudinary.com/dkht5j3tw/image/upload/v1792312496/SRI_MUGAMBIGAI_Industries_Tech_Logo_ozoude.png"
            alt="Sri Mugambigai Industries logo"
            className="mx-auto h-auto w-[220px] max-w-full object-contain"
          />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#E9ECEF]">
            SMI ERP
          </h1>
          <p className="mt-2 text-sm text-[#8b8fa3]">
            Enterprise Industrial Operations Dashboard
          </p>
        </div>

        <div className="mt-6 space-y-5">

          {/* Notifications */}
          {infoMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FB5607]/30 bg-[#211b18] p-3 text-xs text-[#E9ECEF]">
              <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block font-sans text-sm font-semibold text-[#E9ECEF]">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8fa3]" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#2a2d38] bg-[#171920] pl-9 pr-3 font-sans text-sm font-medium text-[#E9ECEF] placeholder:text-[#8b8fa3] transition-colors focus:border-[#FB5607] focus:outline-none focus:ring-2 focus:ring-[#FB5607]/25 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block font-sans text-sm font-semibold text-[#E9ECEF]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8fa3]" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#2a2d38] bg-[#171920] pl-9 pr-3 font-sans text-sm font-medium text-[#E9ECEF] placeholder:text-[#8b8fa3] transition-colors focus:border-[#FB5607] focus:outline-none focus:ring-2 focus:ring-[#FB5607]/25 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Single Primary Amber Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FB5607] px-4 text-sm font-semibold text-white shadow-[0_0_22px_rgba(251,86,7,0.22)] transition-all hover:bg-[#ff6b26] hover:shadow-[0_0_28px_rgba(251,86,7,0.32)] focus:outline-none focus:ring-2 focus:ring-[#FB5607]/50 disabled:opacity-60"
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
          <div className="rounded-xl border border-[#2a2d38] bg-[#171920] p-3 text-center text-[11px] leading-relaxed text-[#8b8fa3]">
            <span className="font-semibold text-[#E9ECEF]">Demo Credentials:</span>{" "}
            <code className="rounded border border-[#2a2d38] bg-[#21232c] px-1.5 py-0.5 font-mono text-[#E9ECEF]">admin</code> /{" "}
            <code className="rounded border border-[#2a2d38] bg-[#21232c] px-1.5 py-0.5 font-mono text-[#E9ECEF]">Demo@12345</code>
          </div>
        </div>
      </div>

      <p className="absolute bottom-4 left-0 right-0 z-10 px-4 text-center text-[11px] text-[#8b8fa3]">
        Protected system • SMI Industrial ERP • Production Build v1.0
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#121317] text-xs text-[#8b8fa3]">Loading authentication...</div>}>
      <LoginForm />
    </Suspense>
  );
}
