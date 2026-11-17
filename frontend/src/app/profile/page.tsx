"use client";

import Link from "next/link";
import Header from "@/app/components/Header";

export default function ProfilePage() {
  // Временные данные для отображения
  // Позже заменю их данными пользователя с бэкенда
  const user = {
    firstName: "Иван",
    lastName: "Иванов",
    phone: "+7 (999) 123-45-67",
    email: "ivan@example.com",
  };

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <section className="px-6 py-12 md:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
            PARMA RESELL
          </p>

          <h1 className="mt-3 text-3xl font-black text-gray-900">
            Личный кабинет
          </h1>

          <p className="mt-2 text-gray-500">
            Информация о твоём аккаунте
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="bg-[#0057A8] px-6 py-8 text-white sm:px-8">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Аккаунт PARMA RESELL
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-black text-gray-900">
                Личные данные
              </h3>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Имя</p>
                  <p className="mt-2 font-bold text-gray-900">
                    {user.firstName}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Фамилия</p>
                  <p className="mt-2 font-bold text-gray-900">
                    {user.lastName}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Номер телефона</p>
                  <p className="mt-2 font-bold text-gray-900">
                    {user.phone}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">
                    Электронная почта
                  </p>
                  <p className="mt-2 break-all font-bold text-gray-900">
                    {user.email || "Не указана"}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-black text-gray-900">
                  Мои разделы
                </h3>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/purchases"
                    className="flex-1 rounded-xl border border-gray-200 p-4 font-semibold text-[#0057A8] transition hover:border-[#0057A8] hover:bg-blue-50"
                  >
                    Мои покупки →
                  </Link>

                  <Link
                    href="/subscriptions"
                    className="flex-1 rounded-xl border border-gray-200 p-4 font-semibold text-[#0057A8] transition hover:border-[#0057A8] hover:bg-blue-50"
                  >
                    Мои абонементы →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-block text-sm font-semibold text-[#0057A8] transition hover:text-[#F28C28]"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  );
}
