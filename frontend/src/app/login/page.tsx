"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import Header from "@/app/components/Header";

import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "+7" + phone.replace(/\D/g, ""),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка входа");
      }
      router.push("/profile");
    } catch {
      setError("Не удалось выполнить вход. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

          {/* Левая часть */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0057A8] p-10 text-white md:flex">
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                PARMA RESELL
              </p>

              <h1 className="mt-8 text-4xl font-black leading-tight">
                Билеты на любимый баскетбол — ближе, чем кажется
              </h1>

              <p className="mt-5 max-w-sm text-blue-100">
                Покупай и перепродавай билеты на матчи БК ПАРМА
                в одном удобном месте.
              </p>
            </div>

            <div className="relative z-10">
              <div className="h-1 w-16 rounded-full bg-[#F28C28]" />
              <p className="mt-5 text-sm text-blue-200">
                Твоя игра. Твои эмоции. Твоя ПАРМА.
              </p>
            </div>

            <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full border-[35px] border-white/10" />
            <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[25px] border-white/10" />
          </div>

          {/* Правая часть */}
          <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
                Добро пожаловать
              </p>

              <h2 className="mt-3 text-3xl font-black text-gray-900">
                Войти в аккаунт
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Введи данные своего аккаунта PARMA RESELL
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Номер телефона
                </label>

                <div className="flex w-full overflow-hidden rounded-xl border border-gray-200 transition focus-within:border-[#0057A8] focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-4 text-sm text-gray-500">
                    +7
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(999) 123-45-67"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);

                      let formatted = "";

                      if (digits.length > 0) formatted = `(${digits.slice(0, 3)}`;
                      if (digits.length >= 4) formatted += `) ${digits.slice(3, 6)}`;
                      if (digits.length >= 7) formatted += `-${digits.slice(6, 8)}`;
                      if (digits.length >= 9) formatted += `-${digits.slice(8, 10)}`;

                      setPhone(formatted);
                    }}
                    required
                    className="min-w-0 flex-1 px-4 py-3.5 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Пароль
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#0057A8] transition hover:text-[#F28C28]"
                  >
                    Забыли пароль?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введи пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0057A8] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0057A8]"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c5 0 9.27 3.11 11 7-0.6 1.34-1.48 2.54-2.55 3.5" />
                        <path d="M6.61 6.61C4.62 7.76 3.05 9.6 2 12c1.73 3.89 6 7 10 7 1.58 0 3.08-.36 4.42-1" />
                        <path d="m2 2 20 20" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0057A8] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#004582]"
              >
                {loading ? "Входим..." : "Войти"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">PARMA RESELL</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <p className="text-center text-sm text-gray-500">
              Ещё нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-bold text-[#0057A8] transition hover:text-[#F28C28]"
              >
                Зарегистрироваться
              </Link>
            </p>

            <Link
              href="/"
              className="mt-8 text-center text-sm font-medium text-gray-400 transition hover:text-[#0057A8]"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
