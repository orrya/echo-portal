"use client";

export default function SignInPage() {
  const handleWorkAccountLogin = () => {
    window.location.href = "/auth/login-nylas";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = "/auth/redirect";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        
        <button
          onClick={handleWorkAccountLogin}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/30 hover:opacity-90 transition"
        >
          Continue with your Work Account
        </button>

        <button
          onClick={handleMicrosoftLogin}
          className="w-full rounded-xl bg-slate-800/80 px-6 py-4 text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-700/80 transition"
        >
          Continue with Microsoft
        </button>
      </div>
    </div>
  );
}
