import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  mode: "login" | "register" | "reset";
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ mode, title, description, children }: AuthShellProps) {
  const hasDesktopSplit = mode !== "reset";
  const isLogin = mode === "login";

  return (
    <main
      className={`relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#f4f5ef] px-4 ${
        isLogin ? "py-4 sm:py-8" : "py-8"
      } sm:px-6 ${
        hasDesktopSplit
          ? "lg:h-dvh lg:min-h-0 lg:items-stretch lg:justify-stretch lg:overflow-hidden lg:bg-white lg:px-0 lg:py-0"
          : ""
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(67, 82, 52, .035) 1px, transparent 1px), linear-gradient(90deg, rgba(67, 82, 52, .035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, black, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-40 h-[420px] w-[420px] rounded-full bg-[#dff4a1]/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-36 h-[440px] w-[440px] rounded-full bg-[#e7eed3]/70 blur-3xl"
      />

      <section
        className={`relative z-10 w-full rounded-[30px] border border-white/80 bg-white/95 ${
          isLogin ? "p-5 sm:p-9" : "p-6 sm:p-9"
        } shadow-[0_24px_70px_rgba(47,57,33,0.10)] ${
          hasDesktopSplit
            ? "max-w-[1080px] lg:h-dvh lg:min-h-0 lg:max-w-none lg:grid lg:grid-cols-[minmax(500px,0.9fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-0 lg:rounded-none lg:border-0 lg:bg-white lg:p-0 lg:shadow-none"
            : "max-w-[440px]"
        }`}
      >
        <div
          className={
            hasDesktopSplit
              ? "min-h-0 min-w-0 lg:flex lg:items-center lg:justify-center lg:overflow-y-auto lg:px-12 lg:py-8 xl:px-20"
              : undefined
          }
        >
          <div className={hasDesktopSplit ? "w-full lg:max-w-[560px]" : undefined}>
          <header
            className={`${isLogin ? "mb-4 sm:mb-7" : "mb-7"} flex flex-col items-center text-center ${
              hasDesktopSplit ? "lg:mb-8 lg:items-start lg:text-left" : ""
            }`}
          >
            <Image
              src="/clover-logo.png"
              alt="Clover"
              width={52}
              height={52}
              className={`${isLogin ? "mb-3 h-10 w-10 sm:mb-4 sm:h-[52px] sm:w-[52px]" : "mb-4 h-[52px] w-[52px]"} object-contain ${
                hasDesktopSplit ? "lg:mb-6 lg:h-16 lg:w-16" : ""
              }`}
              priority
            />
            <h1
              className={`font-bold tracking-[-0.045em] text-[#172016] ${
                hasDesktopSplit
                  ? "text-[28px] sm:text-[32px] lg:text-[48px] lg:leading-[1.05]"
                  : "text-[25px] sm:text-[28px]"
              }`}
            >
              {title}
            </h1>
            <p
              className={`mt-1.5 max-w-[310px] text-sm leading-5 text-[#6b7066] ${
                hasDesktopSplit ? "lg:mt-3 lg:max-w-[420px] lg:text-base lg:leading-7" : ""
              }`}
            >
              {description}
            </p>
          </header>

          {mode !== "reset" && (
            <nav
              aria-label="Authentication"
              className={`${isLogin ? "mb-4 sm:mb-6" : "mb-6"} grid grid-cols-2 rounded-full bg-[#f3f4f1] p-1 ${
                hasDesktopSplit ? "lg:mb-8 lg:max-w-[420px]" : ""
              }`}
            >
              <Link
                href="/register"
                aria-current={mode === "register" ? "page" : undefined}
                className={`flex ${
                  isLogin ? "h-9 sm:h-10" : "h-10"
                } items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  mode === "register"
                    ? "bg-[#c9ef5b] text-[#1c2911] shadow-sm"
                    : "text-[#777b72] hover:text-[#252c20]"
                }`}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                aria-current={mode === "login" ? "page" : undefined}
                className={`flex ${
                  isLogin ? "h-9 sm:h-10" : "h-10"
                } items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-[#c9ef5b] text-[#1c2911] shadow-sm"
                    : "text-[#777b72] hover:text-[#252c20]"
                }`}
              >
                Log in
              </Link>
            </nav>
          )}

          {children}
          </div>
        </div>

        {hasDesktopSplit && (
          <aside className="relative mt-8 hidden min-h-[700px] overflow-hidden rounded-[30px] border border-[#e5ebd7] bg-[#dfe8d2] p-3 lg:m-4 lg:flex lg:min-h-0">
            <div className="relative flex min-h-0 w-full flex-1 flex-col justify-between overflow-hidden rounded-[22px] p-7 xl:p-10">
              <Image
                src="/auth-support.jpg"
                alt="Healthcare professional offering support"
                fill
                sizes="(min-width: 1024px) 55vw, 0px"
                className="object-cover object-center"
                priority
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-[#162315]/25 via-transparent to-[#162315]/75"
              />
              <div className="relative z-10 flex items-center gap-2 self-start rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold tracking-wide text-[#35442a] shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#a8d63d]" />
                HERE FOR YOUR WELL-BEING
              </div>
              <div className="relative z-10 max-w-[620px] pb-2 text-white">
                <p className="text-3xl font-bold tracking-[-0.035em] xl:text-5xl xl:leading-[1.08]">
                  Support that feels personal.
                </p>
                <p className="mt-4 max-w-[480px] text-base leading-7 text-white/90 xl:text-lg xl:leading-8">
                  Share what you need, and our team will help you take the next step with care.
                </p>
              </div>
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}
