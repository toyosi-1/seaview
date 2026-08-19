import Image from 'next/image'

export function BrandPanel() {
  return (
    <div className="relative flex w-full lg:w-[45%] flex-col items-center justify-center overflow-hidden bg-spl-blue px-6 py-10 lg:px-12 lg:py-0">
      <div className="absolute inset-0 bg-gradient-to-br from-spl-blue via-spl-blue to-spl-blue-dark" />
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
      {/* Ambient glow behind the badge */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-white/15 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-white shadow-2xl ring-4 ring-white/10 flex items-center justify-center p-3 lg:p-4">
          <Image src="/brand/spl-logo-mark.png" alt="Seaview Properties Limited" width={112} height={112} className="object-contain w-full h-full" priority />
        </div>
        <h1 className="mt-5 lg:mt-7 text-2xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
          Seaview Properties<br />Limited
        </h1>
        <p className="text-spl-blue-light text-sm lg:text-lg mt-1 lg:mt-2">Procurement & Contractor Portal</p>

        <div className="mt-5 lg:mt-10 flex items-center gap-2.5 lg:gap-3 rounded-full bg-white/10 border border-white/15 pl-1.5 pr-4 lg:pl-2 lg:pr-5 py-1.5 lg:py-2 backdrop-blur-sm">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 p-1 shadow-md">
            <Image src="/brand/npa-logo-mark.png" alt="Nigerian Ports Authority" width={60} height={60} className="object-contain w-full h-full" />
          </div>
          <p className="text-slate-200 text-xs lg:text-sm">A subsidiary of the Nigerian Ports Authority</p>
        </div>
      </div>

      {/* Wave motif echoing the brand mark */}
      <svg className="hidden lg:block absolute bottom-0 left-0 w-full text-white/10" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
        <path d="M0 60 Q 125 10, 250 60 T 500 60 T 750 60 T 1000 60 V120 H0 Z" fill="currentColor" />
        <path d="M0 85 Q 125 40, 250 85 T 500 85 T 750 85 T 1000 85 V120 H0 Z" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  )
}
