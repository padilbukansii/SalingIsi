import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthPage from "./components/AuthPage";
import Icon from "./components/Icons";
import {
  completeSurvey,
  createSurvey as createSurveyRequest,
  deleteSurvey as deleteSurveyRequest,
  getMyState,
  getSurveys,
} from "./lib/api";
import { supabase } from "./lib/supabase";
import type { MySurvey, Page, PointActivity, Survey, SurveyDraft } from "./types";

const categories = ["Semua", "Umum", "Pendidikan", "Teknologi", "Gaya Hidup", "Lingkungan"];

const navItems: { id: Page; label: string; icon: "home" | "plus" | "user" }[] = [
  { id: "home", label: "Daftar Survei", icon: "home" },
  { id: "create", label: "Buat Survei", icon: "plus" },
  { id: "profile", label: "Profil Saya", icon: "user" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-[#5b4cf0] text-white shadow-[0_6px_16px_rgba(91,76,240,.25)]">
        <Icon name="sparkles" size={20} />
      </div>
      <div>
        <div className="w-[76px] -translate-x-1 text-lg font-extrabold tracking-[-0.04em] text-slate-900">
          SalingIsi
        </div>
        <div className="-mt-1 h-[13px] text-[10px] font-semibold tracking-[0.12em] text-slate-400">
          SURVEI JADI MUDAH
        </div>
      </div>
    </div>
  );
}

function Header({
  page,
  points,
  onNavigate,
}: {
  page: Page;
  points: number;
  onNavigate: (page: Page) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <button onClick={() => onNavigate("home")} aria-label="Ke halaman utama">
          <Logo />
        </button>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                page === item.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => onNavigate("profile")}
          className="flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-bold text-[#5545e8] transition hover:bg-violet-100"
        >
          <Icon name="coins" size={18} />
          <span>{points}</span>
          <span className="hidden font-medium text-violet-400 sm:inline">poin</span>
        </button>
      </div>
    </header>
  );
}

function MobileNav({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-sm grid-cols-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold ${
              page === item.id ? "text-[#5b4cf0]" : "text-slate-400"
            }`}
          >
            <Icon name={item.icon} size={21} />
            {item.label.replace("Daftar ", "")}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SurveyCard({
  survey,
  completed,
  isOwner,
  onComplete,
}: {
  survey: Survey;
  completed: boolean;
  isOwner: boolean;
  onComplete: (survey: Survey) => Promise<void>;
}) {
  const [started, setStarted] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleAction() {
    if (!started) {
      window.open(survey.link, "_blank", "noopener,noreferrer");
      setStarted(true);
      return;
    }
    setCompleting(true);
    await onComplete(survey);
    setCompleting(false);
  }

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_40px_rgba(91,76,240,.09)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
          {survey.category}
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-extrabold text-amber-600">
          <Icon name="coins" size={16} />
          +{survey.reward}
        </div>
      </div>
      <h3 className="mb-2.5 text-lg font-extrabold leading-snug tracking-[-0.025em] text-slate-900">
        {survey.title}
      </h3>
      <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-500">
        {survey.description}
      </p>
      <div className="mb-5 mt-auto">
        <div className="mb-2 flex justify-between text-[11px] font-semibold text-slate-400">
          <span>{survey.responses} respons</span>
          <span>{survey.target} target</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#695af3]"
            style={{ width: `${Math.min((survey.responses / survey.target) * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
        <div
          className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-extrabold ${survey.color}`}
        >
          {survey.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-700">{survey.author}</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <Icon name="clock" size={12} /> ± {survey.duration} menit
          </p>
        </div>
        <button
          disabled={completed || isOwner || survey.status === "Selesai" || completing}
          onClick={handleAction}
          className={`ml-auto flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
            completed || survey.status === "Selesai"
              ? "cursor-default bg-emerald-50 text-emerald-600"
              : isOwner
                ? "cursor-default bg-violet-50 text-violet-600"
                : completing
                  ? "cursor-wait bg-slate-200 text-slate-500"
              : started
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-900 text-white hover:bg-[#5b4cf0]"
          }`}
        >
          {isOwner ? (
            "Survei Anda"
          ) : completing ? (
            "Memproses..."
          ) : completed || survey.status === "Selesai" ? (
            <>
              <Icon name="check" size={15} /> Selesai
            </>
          ) : (
            <>
              {started ? "Selesai mengisi" : "Isi survei"}{" "}
              <Icon name={started ? "check" : "arrow"} size={15} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function HomePage({
  surveys,
  userId,
  points,
  completed,
  onComplete,
  onNavigate,
}: {
  surveys: Survey[];
  userId: string;
  points: number;
  completed: number[];
  onComplete: (survey: Survey) => Promise<void>;
  onNavigate: (page: Page) => void;
}) {
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");

  const filtered = surveys.filter(
    (survey) =>
      (category === "Semua" || survey.category === category) &&
      survey.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main>
      <section className="overflow-hidden border-b border-indigo-100 bg-[linear-gradient(135deg,#f5f3ff_0%,#eef6ff_52%,#f7fbff_100%)]">
        <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-violet-200/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_380px]">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-violet-600">
                <Icon name="sparkles" size={15} /> Take and give, bertumbuh bersama
              </div>
              <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.045em] text-slate-900 sm:text-5xl">
                Bantu riset teman,
                <br />
                <span className="text-[#5b4cf0]">wujudkan risetmu.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Isi survei mahasiswa lain untuk mengumpulkan poin. Gunakan poinmu
                agar survei milikmu mendapat lebih banyak responden.
              </p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(70,56,180,.12)] backdrop-blur">
              <p className="text-sm font-semibold text-slate-500">Saldo poinmu</p>
              <div className="my-3 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-600">
                  <Icon name="coins" size={27} />
                </div>
                <span className="text-4xl font-black tracking-tight text-slate-900">
                  {points}
                </span>
                <span className="self-end pb-1.5 text-sm font-semibold text-slate-400">
                  poin
                </span>
              </div>
              <button
                onClick={() => onNavigate("create")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b4cf0] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(91,76,240,.25)] transition hover:bg-[#493bd1]"
              >
                <Icon name="plus" size={18} /> Publikasikan survei
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#5b4cf0]">
              Survei tersedia
            </p>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-900 sm:text-3xl">
              Pilih survei untuk dikerjakan
            </h2>
          </div>
          <div className="relative w-full lg:w-72">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari survei..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>
        <div className="no-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                category === item
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                completed={completed.includes(survey.id)}
                isOwner={survey.ownerId === userId}
                onComplete={onComplete}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
            <p className="font-bold text-slate-700">
              {surveys.length === 0 ? "Belum ada survei tersedia" : "Survei tidak ditemukan"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {surveys.length === 0
                ? "Survei yang dipublikasikan akan muncul di sini."
                : "Coba kata kunci atau kategori lain."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function CreatePage({
  points,
  onSubmit,
}: {
  points: number;
  onSubmit: (survey: SurveyDraft) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<number | "">(10);
  const [reward, setReward] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const targetValue = target === "" ? 0 : target;
  const totalCost = targetValue * reward;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (totalCost > points) {
      setMessage(`Poin belum cukup. Kamu masih membutuhkan ${totalCost - points} poin.`);
      return;
    }
    setSubmitting(true);
    await onSubmit({
      title,
      description,
      link,
      target: targetValue,
      reward,
    });
    setSubmitting(false);
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#5b4cf0]">
            Post survey
          </p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
            Publikasikan surveimu
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Lengkapi informasi survei dan tentukan jumlah responden yang kamu butuhkan.
          </p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="space-y-6">
              <Field label="Judul survei" hint={`${title.length}/80`}>
                <input
                  required
                  maxLength={80}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Pengaruh media sosial terhadap pola tidur"
                  className="field"
                />
              </Field>
              <Field label="Deskripsi singkat" hint={`${description.length}/240`}>
                <textarea
                  required
                  maxLength={240}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Jelaskan tujuan dan kriteria responden surveimu..."
                  className="field resize-none"
                />
              </Field>
              <Field label="Tautan Google Form / survei">
                <div>
                  <input
                    required
                    type="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://forms.gle/..."
                    className="field"
                  />
                </div>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Target responden">
                  <input
                    required
                    type="number"
                    min={5}
                    max={500}
                    value={target}
                    onChange={(event) =>
                      setTarget(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    className="field"
                  />
                </Field>
                <Field label="Poin per responden">
                  <select
                    value={reward}
                    onChange={(event) => setReward(Number(event.target.value))}
                    className="field"
                  >
                    <option value={5}>5 poin</option>
                    <option value={10}>10 poin</option>
                    <option value={15}>15 poin</option>
                    <option value={20}>20 poin</option>
                  </select>
                </Field>
              </div>
            </div>
            {message && (
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                <Icon name="info" size={18} className="mt-0.5 shrink-0" /> {message}
              </div>
            )}
            <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
              <p className="text-xs leading-5 text-slate-400">
                Pastikan tautan dapat diakses oleh publik.
              </p>
              <button
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b4cf0] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(91,76,240,.22)] transition hover:bg-[#493bd1] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "Mempublikasikan..." : "Publikasikan sekarang"}
                {!submitting && <Icon name="arrow" size={17} />}
              </button>
            </div>
          </form>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-[#2d2d84] p-6 text-white shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Ringkasan biaya</span>
                <Icon name="coins" className="text-amber-400" />
              </div>
              <div className="space-y-3 border-b border-slate-700 pb-5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span className="text-white">Target responden</span>
                  <span className="font-bold text-white">{targetValue} orang</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="text-white">Reward per orang</span>
                  <span className="font-bold text-white">{reward} poin</span>
                </div>
              </div>
              <div className="flex items-end justify-between pt-5">
                <span className="text-sm text-white">Total potongan</span>
                <span className="text-3xl font-black text-amber-400">{totalCost}</span>
              </div>
              <div className="mt-5 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white">
                Saldo kamu: <strong className="text-white">{points} poin</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <div className="flex gap-3">
                <Icon name="sparkles" className="shrink-0 text-violet-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Tips survei efektif</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Judul yang jelas dan reward yang menarik membantu surveimu selesai lebih cepat.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex justify-between text-sm font-bold text-slate-700">
        {label}
        {hint && <span className="font-medium text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ProfilePage({
  points,
  mySurveys,
  activities,
  completedCount,
  name,
  university,
  initials,
  onDeleteSurvey,
  onSignOut,
}: {
  points: number;
  mySurveys: MySurvey[];
  activities: PointActivity[];
  completedCount: number;
  name: string;
  university: string;
  initials: string;
  onDeleteSurvey: (survey: MySurvey) => void;
  onSignOut: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <section className="mb-6 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#17162d,#332a78)] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/20">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
                  Profil mahasiswa
                </p>
                <h1 className="mt-1 text-2xl font-black">{name}</h1>
                <p className="mt-1 text-sm text-slate-400">{university}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/10">
                <p className="text-xs font-semibold text-slate-400">Total saldo</p>
                <div className="mt-1 flex items-center gap-2">
                  <Icon name="coins" className="text-amber-400" size={25} />
                  <span className="text-3xl font-black">{points}</span>
                  <span className="text-sm text-slate-400">poin</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-violet-100 transition hover:bg-white/10 hover:text-white"
              >
                Keluar dari akun
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon="survey" value={mySurveys.length} label="Survei dipublikasi" color="violet" />
          <StatCard icon="check" value={completedCount} label="Survei diselesaikan" color="emerald" />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              icon="chart"
              value={mySurveys.reduce((total, item) => total + item.responses, 0)}
              label="Total responden"
              color="amber"
            />
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5b4cf0]">
                  Survei saya
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Progres responden</h2>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="chart" />
              </div>
            </div>
            {mySurveys.length ? (
              <div className="space-y-4">
                {mySurveys.map((survey) => {
                  const progress = Math.round((survey.responses / survey.target) * 100);
                  return (
                    <div key={survey.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold leading-5 text-slate-800">
                            {survey.title}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Dibuat {survey.createdAt} · {survey.reward} poin/responden
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                            {survey.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteSurvey(survey)}
                            className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            aria-label={`Hapus survei ${survey.title}`}
                            title="Hapus survei"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-semibold text-slate-500">
                          {survey.responses} dari {survey.target} responden
                        </span>
                        <span className="font-bold text-violet-600">{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#695af3]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <Icon name="survey" size={30} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Belum ada survei</p>
                <p className="mt-1 text-xs text-slate-400">Survei yang kamu buat akan muncul di sini.</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Icon name="history" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-amber-600">
                  Aktivitas
                </p>
                <h2 className="text-lg font-black text-slate-900">Riwayat poin</h2>
              </div>
            </div>
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0"
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${
                      activity.amount > 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    <Icon name={activity.amount > 0 ? "plus" : "arrow"} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-700">{activity.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{activity.date}</p>
                  </div>
                  <span
                    className={`text-sm font-black ${
                      activity.amount > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {activity.amount > 0 ? "+" : ""}
                    {activity.amount}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: "survey" | "check" | "chart";
  value: number;
  label: string;
  color: "violet" | "emerald" | "amber";
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${colors[color]}`}>
        <Icon name={icon} />
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight text-slate-900">{value}</p>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(false);
  const [passwordRecoveryFromLink, setPasswordRecoveryFromLink] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [points, setPoints] = useState(200);
  const [completed, setCompleted] = useState<number[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activities, setActivities] = useState<PointActivity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryActive(true);
        setPasswordRecoveryFromLink(true);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!session) {
      setDataLoading(false);
      return;
    }

    let active = true;
    async function loadSharedData(showLoading = false) {
      if (showLoading) setDataLoading(true);
      try {
        const [{ surveys: nextSurveys }, state] = await Promise.all([
          getSurveys(),
          getMyState(),
        ]);
        if (!active) return;
        setSurveys(nextSurveys);
        setPoints(state.points);
        setCompleted(state.completed);
        setActivities(state.activities);
      } catch (error) {
        if (active && showLoading) {
          setToast(error instanceof Error ? error.message : "Gagal memuat data aplikasi.");
        }
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadSharedData(true);
    const interval = window.setInterval(() => loadSharedData(), 15000);
    const handleFocus = () => loadSharedData();
    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session?.user.id]);

  const profileName =
    session?.user.user_metadata.full_name ??
    session?.user.user_metadata.name ??
    "Muhammad Fadhil Nursofa";
  const profileUniversity =
    session?.user.user_metadata.university ?? "Universitas Pendidikan Indonesia";
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();
  const mySurveys = surveys.filter((survey) => survey.ownerId === session?.user.id);
  const availableSurveys = surveys.filter(
    (survey) => !completed.includes(survey.id),
  ).length;

  async function handleComplete(survey: Survey) {
    if (completed.includes(survey.id)) return;
    try {
      const result = await completeSurvey(survey.id);
      setSurveys(
        surveys.map((item) => (item.id === survey.id ? result.survey : item)),
      );
      setCompleted([...completed, survey.id]);
      setPoints(result.points);
      setActivities([result.activity, ...activities]);
      setToast(`Survei selesai. +${survey.reward} poin ditambahkan!`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal menyelesaikan survei.");
    }
  }

  async function handleCreate(survey: SurveyDraft) {
    try {
      const result = await createSurveyRequest(survey);
      setSurveys([result.survey, ...surveys]);
      setPoints(result.points);
      const state = await getMyState();
      setActivities(state.activities);
      setToast("Survei berhasil dipublikasikan!");
      setPage("profile");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal mempublikasikan survei.");
    }
  }

  async function handleDeleteSurvey(survey: MySurvey) {
    const confirmed = window.confirm(
      `Hapus survei "${survey.title}"? Survei akan hilang dari halaman utama dan poin yang sudah digunakan tidak dikembalikan.`,
    );
    if (!confirmed) return;

    try {
      await deleteSurveyRequest(survey.id);
      setSurveys(surveys.filter((item) => item.id !== survey.id));
      setToast("Survei berhasil dihapus.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal menghapus survei.");
    }
  }

  function navigate(target: Page) {
    setPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePasswordRecoveryStateChange(active: boolean) {
    setPasswordRecoveryActive(active);
    if (!active) setPasswordRecoveryFromLink(false);
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setToast("Gagal keluar dari akun. Silakan coba lagi.");
      return;
    }
    setPage("home");
  }

  if (authLoading || (!!session && dataLoading && !passwordRecoveryActive)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          Menyiapkan SalingIsi...
        </div>
      </div>
    );
  }

  if (!session || passwordRecoveryActive) {
    return (
      <AuthPage
        onRecoveryStateChange={handlePasswordRecoveryStateChange}
        recoveryVerified={passwordRecoveryFromLink}
        recoveryEmail={session?.user.email}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 text-slate-900 md:pb-0">
      <Header page={page} points={points} onNavigate={navigate} />
      {page === "home" && (
        <HomePage
          surveys={surveys}
          userId={session.user.id}
          points={points}
          completed={completed}
          onComplete={handleComplete}
          onNavigate={navigate}
        />
      )}
      {page === "create" && <CreatePage points={points} onSubmit={handleCreate} />}
      {page === "profile" && (
        <ProfilePage
          points={points}
          mySurveys={mySurveys}
          activities={activities}
          completedCount={completed.length}
          name={profileName}
          university={profileUniversity}
          initials={profileInitials}
          onDeleteSurvey={handleDeleteSurvey}
          onSignOut={handleSignOut}
        />
      )}
      <MobileNav page={page} onNavigate={navigate} />
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-2xl md:bottom-7">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500">
            <Icon name="check" size={16} />
          </span>
          {toast}
        </div>
      )}
      <span className="sr-only">{availableSurveys} survei tersedia</span>
    </div>
  );
}
