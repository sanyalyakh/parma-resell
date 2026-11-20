
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, ApiUser, getToken } from "@/app/lib/api";
import Header from "@/app/components/Header";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const [savedUserData, setSavedUserData] = useState(userData);
  useEffect(() => {
    if (!getToken()) { Promise.resolve().then(() => setError("Войдите, чтобы увидеть профиль")); return; }
    apiRequest<{user: ApiUser}>("/api/auth/me").then(({user}) => {
      const data = {firstName: user.first_name || "", lastName: user.last_name || "", phone: user.phone, email: user.email || ""};
      setUserData(data); setSavedUserData(data);
    }).catch(e => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, []);
  async function saveProfile() {
    setSaving(true); setError("");
    try {
      const {user} = await apiRequest<{user: ApiUser}>("/api/auth/me", {
        method: "PATCH", body: JSON.stringify({first_name: userData.firstName, last_name: userData.lastName, email: userData.email})
      });
      const data = {firstName: user.first_name || "", lastName: user.last_name || "", phone: user.phone, email: user.email || ""};
      setUserData(data); setSavedUserData(data); setIsEditing(false);
    } catch(e) {setError(e instanceof Error ? e.message : "Не удалось сохранить профиль");}
    finally {setSaving(false);}
  }

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

          {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
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
                    {userData.firstName} {userData.lastName}
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

              {isEditing ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      void saveProfile();
                    }}
                    className="rounded-xl bg-[#0057A8] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Сохранить
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserData(savedUserData);
                      setIsEditing(false);
                    }}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-4 rounded-xl bg-[#0057A8] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Редактировать профиль
                </button>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Имя</p>

                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          firstName: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-900 outline-none focus:border-[#0057A8]"
                    />
                  ) : (
                    <p className="mt-2 font-bold text-gray-900">
                      {userData.firstName}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Фамилия</p>

                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          lastName: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-900 outline-none focus:border-[#0057A8]"
                    />
                  ) : (
                    <p className="mt-2 font-bold text-gray-900">
                      {userData.lastName}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">Номер телефона</p>

                  <p className="mt-2 font-bold text-gray-900">{userData.phone || "—"}</p>
                  <p className="mt-1 text-xs text-gray-500">Изменение номера требует SMS-подтверждения</p>
                </div>

                <div className="rounded-xl bg-[#F3F6FA] p-4">
                  <p className="text-sm text-gray-500">
                    Электронная почта
                  </p>

                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          email: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-900 outline-none focus:border-[#0057A8]"
                    />
                  ) : (
                    <p className="mt-2 break-all font-bold text-gray-900">
                      {userData.email || "Не указана"}
                    </p>
                  )}
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
