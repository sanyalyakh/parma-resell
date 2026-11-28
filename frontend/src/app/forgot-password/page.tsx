"use client";

import { useState } from "react";

import Link from "next/link";

import Header from "@/app/components/Header";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPhoneValid = phone.replace(/\D/g, "").length === 10;
  const isCodeValid = /^\d{6}$/.test(code);
  const isPasswordValid =
    password.length >= 8 && password === confirmPassword;

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    let formatted = "";

    if (digits.length > 0) formatted = `(${digits.slice(0, 3)}`;
    if (digits.length >= 4) formatted += `) ${digits.slice(3, 6)}`;
    if (digits.length >= 7) formatted += `-${digits.slice(6, 8)}`;
    if (digits.length >= 9) formatted += `-${digits.slice(8, 10)}`;

    setPhone(formatted);
  };

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
              PARMA RESELL
            </p>

            <h1 className="mt-4 text-3xl font-black text-gray-900">
              Восстановление пароля
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {step === 1 &&
                "Укажи номер телефона, привязанный к аккаунту. Мы отправим на него код подтверждения."}

              {step === 2 &&
                `Введи шестизначный код из SMS, отправленный на номер +7 ${phone}.`}

              {step === 3 &&
                "Придумай новый пароль для своего аккаунта."}
            </p>
          </div>

          {step === 1 && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (isPhoneValid) setStep(2);
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
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    className="min-w-0 flex-1 px-4 py-3.5 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isPhoneValid}
                className="w-full rounded-xl bg-[#0057A8] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#004582] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Отправить код
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (isCodeValid) setStep(3);
              }}
            >
              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Код из SMS
                </label>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Введите 6 цифр"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-center text-lg font-bold tracking-[0.4em] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#0057A8] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={!isCodeValid}
                className="w-full rounded-xl bg-[#0057A8] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#004582] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Подтвердить код
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm font-semibold text-gray-500 transition hover:text-[#0057A8]"
              >
                Изменить номер телефона
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (isPasswordValid) {
                  alert("Демонстрация завершена. Сохранение пароля подключим через API.");
                }
              }}
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Новый пароль
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 8 символов"
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
                    {showPassword ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Повтори новый пароль
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повтори пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0057A8] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0057A8]"
                    aria-label={
                      showConfirmPassword
                        ? "Скрыть пароль"
                        : "Показать пароль"
                    }
                  >
                    {showConfirmPassword ? "Скрыть" : "Показать"}
                  </button>
                </div>

                {confirmPassword.length > 0 &&
                  password !== confirmPassword && (
                    <p className="mt-2 text-xs text-red-500">
                      Пароли не совпадают
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={!isPasswordValid}
                className="w-full rounded-xl bg-[#0057A8] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#004582] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Сохранить новый пароль
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-7 block text-center text-sm font-semibold text-[#0057A8] transition hover:text-[#F28C28]"
          >
            ← Вернуться ко входу
          </Link>
        </div>
      </section>
    </main>
  );
}
