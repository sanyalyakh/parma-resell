import MatchCard from "./components/MatchCard";
const matches = [
  {
    id: 1,
    opponent: "Соперник 01",
    hasOffers: true,
    date: "15 декабря, 19:00",
  },
  {
    id: 2,
    opponent: "Соперник 02",
    hasOffers: true,
    date: "05 января, 19:00",
  },
  {
    id: 3,
    opponent: "Соперник 03",
    hasOffers: false,
    date: "15 января, 19:00",
  },
  {
  id: 4,
  opponent: "Соперник 04",
  hasOffers: false,
  date: "25 января, 19:00",
  },
];
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Шапка сайта */}
      <header className="flex items-center justify-between px-6 py-5 md:px-16">
        <a href="/" className="text-2xl font-black tracking-tight">
          PARMA<span className="text-orange-500">.</span>
          <span className="ml-2 text-sm font-medium text-gray-500">
            RESELL
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a href="#matches" className="transition hover:text-orange-500">
            Матчи
          </a>
          <a href="#how-it-works" className="transition hover:text-orange-500">
            Как это работает
          </a>
          <a href="#about" className="transition hover:text-orange-500">
            О сервисе
          </a>
        </nav>

        <button className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
          Войти
        </button>
      </header>

      {/* Главный экран */}
      <section className="relative overflow-hidden bg-[#0057A8] px-6 py-24 text-white md:px-16 md:py-36">
        <div className="relative z-10 max-w-3xl">
          <p className="mb-6 text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
            PARMA RESELL · БК ПАРМА
          </p>

          <h1 className="text-5xl font-black uppercase leading-tight tracking-tight md:text-7xl">
            Будь ближе
            <br />
            к игре<span className="text-orange-500">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300">
            Покупай и передавай права на посещение домашних матчей
            БК ПАРМА. Твоя возможность попасть на игру начинается здесь.
          </p>

          <a
            href="#matches"
            className="mt-10 inline-block rounded-lg bg-orange-500 px-8 py-4 font-bold text-white transition hover:bg-orange-600"
          >
            Смотреть матчи →
          </a>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full border-[60px] border-orange-500/20" />
      </section>

      {/* Каталог ближайших матчей */}
      <section id="matches" className="bg-gray-50 px-6 py-20 md:px-16">

        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#F28C28]">
              Расписание
            </p>

            <h2 className="text-3xl font-black uppercase md:text-4xl">
              Ближайшие матчи
            </h2>

            <p className="mt-3 text-gray-500">
              Выбирай игру и находи доступные места.
            </p>
          </div>

          <a
            href="#matches"
            className="font-bold text-[#0057A8] transition hover:text-[#F28C28]"
          >
            Все матчи →
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {matches.map((match) => (
            <MatchCard
              key={match.id}
              id={match.id}
              opponent={match.opponent}
              hasOffers={match.hasOffers}
              date={match.date}
            />
          ))}

        </div>

      </section>
    </main>
  );
}
