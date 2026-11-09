import { useState, type FormEvent } from "react"
import { supabase } from "../lib/supabase"
import Icon from "./Icons"

type AuthMode = "login" | "register" | "forgot"

const studyPrograms = [
  { value: "Teknik Komputer", label: "Tekkom — Teknik Komputer" },
  { value: "Rekayasa Perangkat Lunak", label: "RPL — Rekayasa Perangkat Lunak" },
  { value: "Pendidikan Multimedia", label: "PMM — Pendidikan Multimedia" },
  { value: "PGPAUD", label: "PGPAUD" },
  { value: "PGSD", label: "PGSD" },
]

function getErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email atau kata sandi tidak sesuai."
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "Email ini sudah terdaftar. Silakan masuk."
  }
  if (message.toLowerCase().includes("password should be")) {
    return "Kata sandi harus terdiri dari minimal 6 karakter."
  }
  if (
    message.toLowerCase().includes("token has expired") ||
    message.toLowerCase().includes("otp expired")
  ) {
    return "Kode sudah kedaluwarsa. Silakan minta kode baru."
  }
  if (
    message.toLowerCase().includes("token is invalid") ||
    message.toLowerCase().includes("invalid otp")
  ) {
    return "Kode pemulihan tidak valid."
  }
  return message
}

export default function AuthPage({
  onRecoveryStateChange,
  recoveryVerified = false,
  recoveryEmail = "",
}: {
  onRecoveryStateChange?: (active: boolean) => void
  recoveryVerified?: boolean
  recoveryEmail?: string
}) {
  const [mode, setMode] = useState<AuthMode>(
    recoveryVerified ? "forgot" : "login",
  )
  const [fullName, setFullName] = useState("")
  const [studyProgram, setStudyProgram] = useState("")
  const [email, setEmail] = useState(recoveryEmail)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [recoverySent, setRecoverySent] = useState(recoveryVerified)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    onRecoveryStateChange?.(nextMode === "forgot")
    setMessage("")
    setIsError(false)
    setShowPassword(false)
    setShowConfirmation(false)
    setRecoveryCode("")
    setRecoverySent(false)
    setPassword("")
    setConfirmation("")
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage("")
    setIsError(false)

    if (
      (mode === "register" || (mode === "forgot" && recoverySent)) &&
      password !== confirmation
    ) {
      setMessage("Konfirmasi kata sandi belum sama.")
      setIsError(true)
      return
    }

    setLoading(true)

    if (mode === "forgot") {
      if (!recoverySent) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })

        if (error) {
          setMessage(getErrorMessage(error.message))
          setIsError(true)
        } else {
          setRecoverySent(true)
          setMessage("Kode pemulihan sudah dikirim. Periksa kotak masuk atau folder spam.")
        }
        setLoading(false)
        return
      }

      if (!recoveryVerified) {
        const { error: verificationError } = await supabase.auth.verifyOtp({
          email,
          token: recoveryCode.trim(),
          type: "recovery",
        })

        if (verificationError) {
          setMessage(getErrorMessage(verificationError.message))
          setIsError(true)
          setLoading(false)
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setMessage(getErrorMessage(updateError.message))
        setIsError(true)
        setLoading(false)
        return
      }

      await supabase.auth.signOut()
      switchMode("login")
      setMessage("Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.")
      setLoading(false)
      return
    }

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            university: "Universitas Pendidikan Indonesia",
            study_program: studyProgram,
          },
        },
      })

      if (error) {
        setMessage(getErrorMessage(error.message))
        setIsError(true)
      } else if (!data.session) {
        setMessage(
          "Akun berhasil dibuat. Periksa email untuk mengonfirmasi akunmu.",
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setMessage(getErrorMessage(error.message))
        setIsError(true)
      }
    }

    setLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-8 sm:grid sm:place-items-center">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_24px_80px_rgba(30,41,59,.12)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden bg-[linear-gradient(145deg,#24206b,#5146d9)] p-10 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Icon name="sparkles" size={22} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              SalingIsi
            </span>
          </div>
          <div className="my-auto py-16">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-violet-200">
              Take and give
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-[-0.04em]">
              Satu jawabanmu,
              <br />
              berarti bagi riset lain.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-violet-100/80">
              Bantu survei mahasiswa lain, kumpulkan poin, dan temukan responden
              untuk risetmu sendiri.
            </p>
          </div>
          <p className="text-xs text-violet-200/70">
            Platform kolaborasi survei untuk mahasiswa Indonesia.
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-[#5b4cf0] text-white">
              <Icon name="sparkles" size={19} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              SalingIsi
            </span>
          </div>

          <div className="mb-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">
              {mode === "login"
                ? "Selamat datang kembali"
                : mode === "register"
                  ? "Mulai berkolaborasi"
                  : "Pemulihan akun"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900">
              {mode === "login"
                ? "Masuk ke akunmu"
                : mode === "register"
                  ? "Buat akun SalingIsi"
                  : recoverySent
                    ? recoveryVerified
                      ? "Buat kata sandi baru"
                      : "Masukkan kode pemulihan"
                    : "Lupa kata sandi?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Lanjutkan mengumpulkan poin dan mengembangkan risetmu."
                : mode === "register"
                  ? "Daftar untuk mulai bertukar kontribusi dengan mahasiswa lain."
                  : recoverySent
                    ? recoveryVerified
                      ? "Tautan berhasil diverifikasi. Masukkan kata sandi barumu."
                      : `Kami mengirimkan kode pemulihan ke ${email}.`
                    : "Masukkan email akunmu untuk menerima kode pemulihan."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-700">
                    Nama lengkap
                  </span>
                  <input
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nama lengkapmu"
                    className="field"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-700">
                    Program studi
                  </span>
                  <select
                    required
                    value={studyProgram}
                    onChange={(event) => setStudyProgram(event.target.value)}
                    className="field"
                  >
                    <option value="" disabled>
                      Pilih program studi
                    </option>
                    {studyPrograms.map((program) => (
                      <option key={program.value} value={program.value}>
                        {program.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {(!recoveryVerified || !recoverySent) && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={mode === "forgot" && recoverySent}
                  placeholder="nama@email.com"
                  className="field disabled:bg-slate-50 disabled:text-slate-500"
                  autoComplete="email"
                />
              </label>
            )}

            {mode === "forgot" && recoverySent && !recoveryVerified && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  Kode pemulihan
                </span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={recoveryCode}
                  onChange={(event) =>
                    setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="Masukkan kode dari email"
                  className="field text-center font-bold tracking-[0.3em]"
                />
              </label>
            )}

            {(mode !== "forgot" || recoverySent) && (
              <div
                className={`grid gap-4 ${
                  mode === "register" || mode === "forgot" ? "sm:grid-cols-2" : ""
                }`}
              >
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  {mode === "forgot" ? "Kata sandi baru" : "Kata sandi"}
                </span>
                <div className="relative">
                  <input
                    required
                    minLength={6}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="field !pr-12"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-violet-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label={
                      showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                    }
                    aria-pressed={showPassword}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={19} />
                  </button>
                </div>
              </label>
              {(mode === "register" || mode === "forgot") && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-700">
                    Konfirmasi sandi
                  </span>
                  <div className="relative">
                    <input
                      required
                      minLength={6}
                      type={showConfirmation ? "text" : "password"}
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="field !pr-12"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation((visible) => !visible)}
                      className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-violet-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      aria-label={
                        showConfirmation
                          ? "Sembunyikan konfirmasi kata sandi"
                          : "Tampilkan konfirmasi kata sandi"
                      }
                      aria-pressed={showConfirmation}
                    >
                      <Icon name={showConfirmation ? "eyeOff" : "eye"} size={19} />
                    </button>
                  </div>
                </label>
              )}
              </div>
            )}

            {mode === "login" && (
              <div className="-mt-1 text-right">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-bold text-violet-600 transition hover:text-violet-800"
                >
                  Lupa kata sandi?
                </button>
              </div>
            )}

            {mode === "forgot" && recoverySent && !recoveryVerified && (
              <button
                type="button"
                onClick={() => {
                  setRecoverySent(false)
                  setRecoveryCode("")
                  setMessage("")
                  setIsError(false)
                }}
                className="text-xs font-bold text-violet-600 transition hover:text-violet-800"
              >
                Kirim ulang atau gunakan email lain
              </button>
            )}

            {message && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold leading-5 ${
                  isError
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b4cf0] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(91,76,240,.22)] transition hover:bg-[#493bd1] disabled:cursor-wait disabled:opacity-60"
            >
              {loading
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk ke SalingIsi"
                  : mode === "register"
                    ? "Daftar sekarang"
                    : recoverySent
                      ? "Perbarui kata sandi"
                      : "Kirim kode pemulihan"}
              {!loading && <Icon name="arrow" size={17} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login"
              ? "Belum punya akun?"
              : mode === "register"
                ? "Sudah punya akun?"
                : "Ingat kata sandimu?"}{" "}
            <button
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
              className="font-extrabold text-violet-600 hover:text-violet-700"
            >
              {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </p>
        </section>
      </div>
    </main>
  )
}
