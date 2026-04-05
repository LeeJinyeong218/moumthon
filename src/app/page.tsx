
import { CtaButton } from "@/components/feature/CtaButton";

export default function MainPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-white">

      {/* 히어로 섹션 */}
      <section className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-5">
        
        {/*  배경 블러들 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 left-10 h-[300px] w-[300px] rounded-full bg-green-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-10 h-[300px] w-[300px] rounded-full bg-lime-200/40 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-5xl">
          
          {/*  메인 타이틀 */}
          <h1 className="mb-6 text-[clamp(3rem,10vw,7rem)] font-black leading-none tracking-tighter">
            <span className="bg-gradient-to-r from-blue-500 via-green-400 to-lime-400 bg-clip-text text-transparent">
              MoumThon
            </span>
          </h1>

          {/* 설명 */}
          <p className="mb-3 max-w-lg text-2xl font-semibold text-gray-800">
            모음톤과 함께 해커톤을 시작해보세요
          </p>

          <p className="max-w-lg text-base text-gray-500 leading-relaxed">
            아이디어를 가진 개발자·디자이너·기획자가 모여
            함께 만들고 성장하는 공간입니다.
          </p>
        </div>
      </section>

      {/* CTA 카드 3개 */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CtaButton variant="hackathon" />
          <CtaButton variant="team" />
          <CtaButton variant="ranking" />
        </div>
      </section>

    </main>
  );
}