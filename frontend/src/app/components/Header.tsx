"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CurrentUser = {
  first_name: string | null;
  last_name: string | null;
  phone: string;
  role: string;
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) setUser(null);
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoggedIn = user !== null;

  const userName =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user?.phone ||
    "Профиль";

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Не удалось выполнить выход");
      }

      setUser(null);
      setIsProfileOpen(false);
      setIsMenuOpen(false);

      window.location.href = "/login";
    } catch {
      alert("Не удалось выйти из аккаунта. Попробуйте ещё раз.");
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="relative z-30 flex items-center justify-between bg-white px-6 py-5 md:px-16">
        {/* Логотип */}
        <Link
          href="/"
          onClick={closeMenu}
          className="text-2xl font-black tracking-tight"
        >
          PARMA<span className="text-orange-500">.</span>
          <span className="ml-2 text-sm font-medium text-gray-500">
            RESELL
          </span>
        </Link>

        {/* Навигация для компьютера */}
        <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
          <Link href="/#matches" className="transition hover:text-orange-500">
            Матчи
          </Link>

          <Link
            href="/#how-it-works"
            className="transition hover:text-orange-500"
          >
            Как это работает
          </Link>

          <Link href="/#about" className="transition hover:text-orange-500">
            О сервисе
          </Link>

          <Link href="/purchases" className="transition hover:text-orange-500">
            Кабинет покупателя
          </Link>

          <Link
            href="/subscriptions"
            className="transition hover:text-orange-500"
          >
            Мои абонементы
          </Link>

          <Link href="/seller" className="transition hover:text-orange-500">
            Кабинет продавца
          </Link>
        </nav>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#0057A8]">
                  <svg
                    width="21"
                    height="21"
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

                <span className="text-sm font-semibold text-gray-900">
                  {userName}
                </span>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition ${isProfileOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#0057A8]"
                  >
                    Личный кабинет
                  </Link>

                  <Link
                    href="/purchases"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#0057A8]"
                  >
                    Мои покупки
                  </Link>

                  <Link
                    href="/subscriptions"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#0057A8]"
                  >
                    Мои абонементы
                  </Link>

                  <Link
                    href="/seller"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#0057A8]"
                  >
                    Кабинет продавца
                  </Link>

                  <div className="my-2 border-t border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="block w-full px-5 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 sm:block"
            >
              Войти
            </Link>
          )}

          {/* Кнопка мобильного меню */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Открыть меню"
            className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Затемнение фона */}
      {isMenuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      {/* Боковая панель */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[300px] max-w-[85vw] flex-col bg-white p-6 shadow-2xl transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Заголовок панели */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-xl font-black tracking-tight"
          >
            PARMA<span className="text-orange-500">.</span>
            <span className="ml-1 text-xs font-medium text-gray-500">
              RESELL
            </span>
          </Link>

          <button
            onClick={closeMenu}
            aria-label="Закрыть меню"
            className="rounded-lg p-2 transition hover:bg-gray-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Основные ссылки */}
        <div className="flex flex-col gap-5 text-base font-semibold">
          <Link
            href="/#matches"
            onClick={closeMenu}
            className="transition hover:text-orange-500"
          >
            Матчи
          </Link>

          <Link
            href="/#how-it-works"
            onClick={closeMenu}
            className="transition hover:text-orange-500"
          >
            Как это работает
          </Link>

          <Link
            href="/#about"
            onClick={closeMenu}
            className="transition hover:text-orange-500"
          >
            О сервисе
          </Link>
        </div>

        <div className="my-7 border-t border-gray-200" />

        {/* Личный кабинет */}
        {isAuthLoading ? null : isLoggedIn ? (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#0057A8]">
                <svg
                  width="24"
                  height="24"
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
                <p className="font-bold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Мой аккаунт</p>
              </div>
            </div>

            <div className="flex flex-col gap-5 text-base font-semibold">
              <Link
                href="/profile"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Личный кабинет
              </Link>

              <Link
                href="/purchases"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Мои покупки
              </Link>

              <Link
                href="/subscriptions"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Мои абонементы
              </Link>

              <Link
                href="/seller"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Кабинет продавца
              </Link>
            </div>

            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Выйти
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-gray-400">
              Личный кабинет
            </p>

            <div className="flex flex-col gap-5 text-base font-semibold">
              <Link
                href="/purchases"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Мои покупки
              </Link>

              <Link
                href="/subscriptions"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Мои абонементы
              </Link>

              <Link
                href="/seller"
                onClick={closeMenu}
                className="transition hover:text-orange-500"
              >
                Кабинет продавца
              </Link>
            </div>

            <div className="mt-auto">
              <Link
                href="/login"
                onClick={closeMenu}
                className="block w-full rounded-xl bg-black px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                Войти
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
