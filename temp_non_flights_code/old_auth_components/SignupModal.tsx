"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ModalLoader from "../ModalLoader";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const { signup, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setIsDissolving(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setIsDissolving(true);

      // Add a small delay for the dissolve animation
      setTimeout(async () => {
        await signup(email, password, displayName);
      }, 300);
    } catch (error) {
      setError("Failed to create account. Please try again.");
      console.error("Signup error:", error);
      setIsDissolving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError("");
      setLoading(true);
      setIsDissolving(true);

      // Add a small delay for the dissolve animation
      setTimeout(async () => {
        await loginWithGoogle();
      }, 300);
    } catch (error) {
      setError("Failed to sign up with Google");
      console.error("Google signup error:", error);
      setIsDissolving(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isDissolving ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Backdrop with blur effect */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ${
          isDissolving ? "opacity-0" : "opacity-100"
        }`}
      ></div>

      {/* Modal */}
      <div
        className={`relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transition-all duration-300 ${
          isDissolving
            ? "opacity-0 scale-90 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-white">Create account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Full Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 disabled:from-blue-500/20 disabled:to-purple-500/20 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all backdrop-blur-sm border border-white/20"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-black/40 text-gray-400 backdrop-blur-sm">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="mt-4 w-full bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{loading ? "Signing up..." : "Continue with Google"}</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Modal Loader */}
      <ModalLoader
        isVisible={loading && isDissolving}
        message="Creating your account..."
      />
    </div>
  );
}
