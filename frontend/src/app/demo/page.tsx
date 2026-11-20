import Link from "next/link";

export const instant = false;

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900 md:px-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold text-blue-700">← На главную</Link>
        <p className="mt-10 text-sm font-bold uppercase tracking-widest text-orange-500">PARMA RESELL · DEMO</p>
        <h1 className="mt-3 text-4xl font-black">Тестовые пользователи</h1>
        <p className="mt-4 text-gray-600">Это вымышленные аккаунты для локального тестирования. Их данные появляются после запуска команды seed-demo. Пароль задаётся вами в файле .env.demo и не публикуется на сайте.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[{name:"Владелец абонемента и покупатель",phone:"+79990000001",detail:"Абонемент A · ряд 1 · место 12, тестовая покупка и будущий матч"},{name:"Второй владелец абонемента",phone:"+79990000002",detail:"Абонемент A · ряд 1 · место 13, история тестового объявления"}].map(user=>(
            <article key={user.phone} className="rounded-2xl bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="mt-4 font-mono text-lg">{user.phone}</p>
              <p className="mt-3 text-gray-600">{user.detail}</p>
              <Link href="/login" className="mt-6 inline-block rounded-lg bg-[#0057A8] px-5 py-3 font-bold text-white">Войти в аккаунт</Link>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-xl border border-orange-300 bg-orange-50 p-5 text-sm">Данные исключительно демонстрационные: билеты не действуют, платежи и перепродажа отключены.</p>
      </div>
    </main>
  );
}
