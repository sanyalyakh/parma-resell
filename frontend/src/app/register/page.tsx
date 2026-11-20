"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, saveSession } from "@/app/lib/api";

import Header from "@/app/components/Header";

import { useState } from "react";



export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) return;
    setPending(true);
    setError("");
    try {
      await apiPost("/api/auth/register", {phone: "+7" + phone, password, ...(email.trim() ? {email: email.trim()} : {})});
      const data = await apiPost<{access_token: string}>("/api/auth/login", {phone: "+7" + phone, password});
      saveSession(data.access_token);
      router.push("/profile");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось зарегистрироваться");
    } finally { setPending(false); }
  }


  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
  });

  const formatPhone = (digits: string) => {
    const a = digits.slice(0, 3);
    const b = digits.slice(3, 6);
    const c = digits.slice(6, 8);
    const d = digits.slice(8, 10);

    let result = "";

    if (a) result += `(${a}`;
    if (a.length === 3) result += ")";
    if (b) result += ` ${b}`;
    if (c) result += `-${c}`;
    if (d) result += `-${d}`;

    return result;
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (email.trim() === "" ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) &&
    phone.length === 10 &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms;

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

          {/* Левая часть */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0057A8] p-10 text-white md:flex">
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                PARMA RESELL
              </p>

              <h1 className="mt-8 text-4xl font-black leading-tight">
                Стань частью большой баскетбольной игры
              </h1>

              <p className="mt-5 max-w-sm text-blue-100">
                Создай аккаунт, чтобы покупать и перепродавать
                билеты на матчи БК ПАРМА.
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
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
                Присоединяйся
              </p>

              <h2 className="mt-3 text-3xl font-black text-gray-900">
                Создать аккаунт
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Заполни данные для регистрации в PARMA RESELL
              </p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {/* Имя и фамилия */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Имя
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, firstName: true }))
                    }
                    placeholder="Иван"
                    required
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      touched.firstName && firstName.trim().length === 0
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-[#0057A8] focus:ring-blue-100"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Фамилия
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, lastName: true }))
                    }
                    placeholder="Иванов"
                    required
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      touched.lastName && lastName.trim().length === 0
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-[#0057A8] focus:ring-blue-100"
                    }`}
                  />
                </div>
              </div>

              {/* Почта */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Электронная почта (необязательно)
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  placeholder="example@mail.com"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                    touched.email &&
                    email.trim().length > 0 &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                      ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-[#0057A8] focus:ring-blue-100"
                  }`}
                />
              </div>

              {/* Телефон */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Номер телефона
                </label>

                <div className="flex w-full items-center rounded-xl border border-gray-200 transition focus-within:border-[#0057A8] focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="border-r border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
                    +7
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    value={formatPhone(phone)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(digits);
                    }}
                    placeholder="(999) 123-45-67"
                    required
                    className={`min-w-0 flex-1 rounded-r-xl px-4 py-3 text-sm outline-none ${
                      phone.length > 0 && phone.length !== 10
                        ? "bg-red-50"
                        : "bg-transparent"
                    }`}
                  />
                </div>
              </div>


              {/* Пароль */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Пароль
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#0057A8] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0057A8]"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9 7 9 7a15 15 0 01-2.1 2.8" />
                        <path d="M6.2 6.2C3.6 8 3 12 3 12s4 7 9 7a9 9 0 004-.9" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Повтор пароля */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Повтори пароль
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    minLength={8}
                    required
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition focus:ring-2 ${
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-[#0057A8] focus:ring-blue-100"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0057A8]"
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 9 7 9 7a15 15 0 01-2.1 2.8" />
                        <path d="M6.2 6.2C3.6 8 3 12 3 12s4 7 9 7a9 9 0 004-.9" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    Пароли не совпадают
                  </p>
                )}
              </div>

              {/* Согласие */}
              <label className="flex items-start gap-3 pt-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 accent-[#0057A8]"
                />

                <span>
                  Я соглашаюсь с условиями использования сервиса
                  и политикой конфиденциальности
                </span>
              </label>

              {/* Кнопка */}
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={!isFormValid || pending}
                className="w-full rounded-xl bg-[#0057A8] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#004582] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Создаём аккаунт..." : "Зарегистрироваться"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="font-bold text-[#0057A8] transition hover:text-[#F28C28]"
              >
                Войти
              </Link>
            </p>

            <Link
              href="/"
              className="mt-6 text-center text-sm font-medium text-gray-400 transition hover:text-[#0057A8]"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
