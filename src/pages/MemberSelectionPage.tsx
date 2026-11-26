import { Link, useLocation } from "react-router-dom"

const kbnLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export default function MemberSelectionPage() {
  const location = useLocation()
  const returnLocation = location.state

  return (
    <main
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[var(--brand-dark)] px-4 py-4 text-center text-white sm:px-8 sm:py-6"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 20%, rgba(26, 51, 92, 0.72), transparent 58%), linear-gradient(145deg, #081324, #0F1D3A 58%, #12264A)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #D4A853 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-3xl animate-fade-in-up">
        <img
          src={kbnLogo}
          alt="Kingdom Builders Network logo"
          className="mx-auto mb-3 h-12 w-12 rounded-full border border-white/25 bg-white object-cover shadow-xl shadow-black/20 sm:mb-4 sm:h-16 sm:w-16"
        />
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] sm:mb-3 sm:text-xs">
          Kingdom Builders Network
        </p>
        <h1 className="font-serif text-3xl leading-tight text-white sm:text-5xl md:text-6xl">
          Building God&apos;s Kingdom
        </h1>
        <p className="mt-2 font-serif text-lg text-[var(--accent)] sm:mt-3 sm:text-2xl">
          Every Day. Everywhere.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-slate-200 sm:mt-5 sm:text-base sm:leading-7">
          A community connecting Ethiopian Christian entrepreneurs and
          professionals across the U.S. and Ethiopia.
        </p>

        <section
          aria-labelledby="member-selection-heading"
          className="mx-auto mt-5 max-w-2xl rounded-3xl border border-white/15 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-sm sm:mt-8 sm:p-8"
        >
          <h2
            id="member-selection-heading"
            className="font-serif text-xl leading-snug text-white sm:text-3xl"
          >
            Are you already a registered member or are you a new member?
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
            <Link
              to="/signup"
              state={returnLocation}
              className="flex min-h-14 flex-col items-center justify-center rounded-full bg-[var(--accent)] px-2 py-2 text-[var(--brand-dark)] shadow-lg shadow-[var(--accent)]/20 transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6 sm:py-3"
            >
              <span className="text-xs font-extrabold sm:text-sm">
                New Member
              </span>
              <span className="mt-0.5 text-[10px] font-medium sm:text-xs">
                Sign Up
              </span>
            </Link>
            <Link
              to="/login"
              state={returnLocation}
              className="flex min-h-14 flex-col items-center justify-center rounded-full border border-white/65 bg-white/5 px-2 py-2 text-white transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:px-6 sm:py-3"
            >
              <span className="text-xs font-extrabold sm:text-sm">
                Existing Member
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-200 sm:text-xs">
                Log In
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
