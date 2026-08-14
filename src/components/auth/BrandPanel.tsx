import Image from 'next/image'

export function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[45%] flex-col items-center justify-center overflow-hidden bg-spl-navy px-12">
      <div className="absolute inset-0 bg-gradient-to-br from-spl-navy via-[#0E263A] to-[#081522]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
      {/* Ambient glow behind the badge */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-spl-blue/25 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-48 h-48 rounded-full bg-white shadow-2xl ring-8 ring-white/10 flex items-center justify-center p-7">
          <Image src="/brand/spl-logo-mark.png" alt="Seaview Properties Limited" width={200} height={200} className="object-contain w-full h-full" priority />
        </div>
        <h1 className="mt-8 text-4xl font-bold text-white tracking-tight leading-tight">
          Seaview Properties<br />Limited
        </h1>
        <p className="text-spl-blue-light text-lg mt-2">Procurement & Contractor Portal</p>

        <div className="mt-10 flex items-center gap-3 rounded-full bg-white/10 border border-white/15 px-5 py-2.5 backdrop-blur-sm">
          <Image src="/brand/npa-logo-mark.png" alt="Nigerian Ports Authority" width={32} height={32} className="object-contain w-8 h-8" />
          <p className="text-slate-200 text-sm">A subsidiary of the Nigerian Ports Authority</p>
        </div>
      </div>

      {/* Wave motif echoing the brand mark */}
      <svg className="absolute bottom-0 left-0 w-full text-spl-blue/20" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
        <path d="M0 60 Q 125 10, 250 60 T 500 60 T 750 60 T 1000 60 V120 H0 Z" fill="currentColor" />
        <path d="M0 85 Q 125 40, 250 85 T 500 85 T 750 85 T 1000 85 V120 H0 Z" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  )
}
