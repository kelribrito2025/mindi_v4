import { Link } from "wouter";
import {
  Clock,
  UserPlus,
  Utensils,
  Rocket,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";

const steps = [
  {
    num: "1",
    title: "Crie sua conta",
    desc: "Cadastro em menos de 2 minutos com e-mail. Sem cartão de crédito, sem compromisso. Acesso imediato ao painel.",
  },
  {
    num: "2",
    title: "Monte seu cardápio",
    desc: "Adicione categorias, produtos com fotos, complementos e preços. Use nossos modelos prontos por segmento para começar mais rápido.",
  },
  {
    num: "3",
    title: "Compartilhe e venda",
    desc: "Coloque o link no Instagram, WhatsApp e bio. Gere o QR Code para as mesas. Pedidos chegam em tempo real no seu painel.",
  },
];

const icons = [
  <UserPlus className="w-6 h-6" />,
  <Utensils className="w-6 h-6" />,
  <Rocket className="w-6 h-6" />,
];

// ============ PROPOSTA 1: Timeline Vertical Elegante ============
function Proposal1() {
  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 -right-32 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
            <Clock className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
              menos de 10 minutos
            </span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        {/* Timeline vertical */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-red-200 via-red-400 to-red-200 hidden md:block" />

          {steps.map((step, i) => (
            <div key={i} className={`relative flex items-center mb-16 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Content */}
              <div className={`w-full md:w-5/12 ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-xl transition-[colors,box-shadow] duration-300">
                  <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? 'md:justify-end' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white">
                      {icons[i]}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>

              {/* Center circle */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-500 items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-500/30 z-10">
                {step.num}
              </div>

              {/* Spacer */}
              <div className="hidden md:block w-5/12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 2: Cards com Gradiente Escuro ============
function Proposal2() {
  return (
    <section className="py-20 lg:py-28 bg-gray-950 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400 tracking-wider">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              menos de 10 minutos
            </span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-20 -translate-y-1/2">
                  <ChevronRight className="w-6 h-6 text-red-500/60" />
                </div>
              )}

              <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-8 hover:border-red-500/30 transition-all duration-500 h-full overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-transparent transition-colors duration-500 rounded-2xl" />

                <div className="relative z-10">
                  {/* Number + Icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl font-black text-red-500/20 group-hover:text-red-500/40 transition-colors duration-500">
                      {step.num}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
                      {icons[i]}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 3: Horizontal Steps com Ícones Grandes ============
function Proposal3() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-red-50 via-white to-orange-50/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold tracking-widest text-red-500 uppercase mb-4 block">COMO FUNCIONA</span>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-red-500">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-[60px] right-0 w-full h-[3px] z-0">
                  <div className="absolute left-[60%] right-0 h-full bg-gradient-to-r from-red-300 to-red-100" />
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center px-8 py-6">
                {/* Large icon circle */}
                <div className="relative mb-6">
                  <div className="w-[120px] h-[120px] rounded-full bg-white border-2 border-red-100 flex items-center justify-center shadow-xl shadow-red-100/50 group-hover:shadow-red-200/60 transition-transform duration-300 group-hover:scale-105">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white">
                      {icons[i]}
                    </div>
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
                    {step.num}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-colors duration-300"
          >
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 4: Cards Lado a Lado com Números Grandes ============
function Proposal4() {
  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - left aligned */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
              menos de 10 minutos
            </span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        {/* Steps - horizontal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              <div className="bg-gray-50 rounded-2xl p-8 hover:bg-red-50/50 transition-colors duration-300 border border-transparent hover:border-red-100 h-full">
                {/* Big number */}
                <div className="text-[80px] font-black leading-none text-gray-100 group-hover:text-red-100 transition-colors duration-300 mb-4">
                  0{step.num}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
                  {icons[i]}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 5: Split Layout com Imagem ============
function Proposal5() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Steps */}
          <div>
            <span className="text-sm font-semibold tracking-widest text-red-500 uppercase mb-4 block">COMO FUNCIONA</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Pronto para vender em{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
                menos de 10 minutos
              </span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-10">
              Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
            </p>

            {/* Steps list */}
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="group flex gap-5 p-5 rounded-xl transition-colors duration-300 border-l-[3px] border-transparent hover:border-l-red-500 hover:bg-red-50/40">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-red-500/20">
                    {icons[i]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">PASSO {step.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-red-500/25"
              >
                <Rocket className="w-5 h-5" />
                Começar agora — é grátis
              </Link>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-red-100/40 via-red-50/20 to-transparent rounded-[3rem] blur-2xl" />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              {/* Fake dashboard preview */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-6 ml-4 flex items-center px-3">
                    <span className="text-xs text-gray-400">app.mindi.com.br</span>
                  </div>
                </div>

                {/* Fake content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="h-3 w-32 bg-gray-200 rounded-full" />
                      <div className="h-2 w-20 bg-gray-100 rounded-full mt-1.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[1,2,3].map(n => (
                      <div key={n} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="h-2 w-12 bg-gray-200 rounded-full mb-2" />
                        <div className="h-5 w-16 bg-red-100 rounded-full" />
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-3 w-24 bg-gray-200 rounded-full" />
                      <div className="h-3 w-16 bg-red-100 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      {[1,2,3].map(n => (
                        <div key={n} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100" />
                          <div className="flex-1">
                            <div className="h-2 w-full bg-gray-100 rounded-full" />
                          </div>
                          <div className="h-2 w-12 bg-green-100 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 6: Minimalista com Linha Horizontal ============
function Proposal6() {
  return (
    <section className="py-20 lg:py-28 bg-[#fafafa] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Comece a vender em{" "}
            <span className="relative">
              <span className="text-red-500">3 passos simples</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M1 5.5C47 2 153 2 199 5.5" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        {/* Steps with horizontal line */}
        <div className="relative">
          {/* Horizontal connector */}
          <div className="hidden md:block absolute top-[28px] left-[16.6%] right-[16.6%] h-[2px] bg-gray-200" />
          <div className="hidden md:block absolute top-[28px] left-[16.6%] h-[2px] bg-gradient-to-r from-red-500 to-red-300" style={{ width: '66.6%' }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="text-center group">
                {/* Circle with number */}
                <div className="relative z-10 mx-auto mb-8">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mx-auto transition-colors duration-300 ${
                    i === 0
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : i === 1
                      ? 'bg-red-400 text-white shadow-lg shadow-red-400/30'
                      : 'bg-red-300 text-white shadow-lg shadow-red-300/30'
                  } group-hover:scale-110`}>
                    {step.num}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">{step.desc}</p>

                {/* Feature tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {i === 0 && (
                    <>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">2 minutos</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Sem cartão</span>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Modelos prontos</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Fotos</span>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">QR Code</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Tempo real</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-red-500 text-white font-semibold px-8 py-4 rounded-full hover:bg-red-500 transition-[colors,box-shadow] duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
          >
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-400 mt-3">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 7: Gradient Mesh com Cards Flutuantes ============
function Proposal7() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)' }}>
      {/* Animated mesh dots */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-5 py-2 mb-6 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400 tracking-wider">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-red-400">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-blue-200/70 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group">
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-500 h-full overflow-hidden">
                {/* Glow on hover */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/0 group-hover:bg-red-500/10 rounded-full blur-3xl transition-colors duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                      {icons[i]}
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-red-400/50 flex items-center justify-center text-red-400 text-sm font-bold">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-blue-200/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold px-8 py-3.5 rounded-full hover:scale-[1.03] transition-transform duration-300 shadow-lg shadow-red-500/30">
            <Rocket className="w-5 h-5" />
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 8: Fundo Vermelho Bold ============
function Proposal8() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-gradient-to-br from-red-500 via-red-500 to-red-500">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white tracking-wider">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-yellow-300">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-red-100 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group">
              <div className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-transform duration-300 hover:-translate-y-2 h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white mx-auto mb-5 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  {icons[i]}
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 text-sm font-bold flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-red-500 font-bold px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors duration-300 shadow-xl">
            <Rocket className="w-5 h-5" />
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 9: Zig-Zag com Fundo Bege ============
function Proposal9() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #fdf6ee 0%, #fef9f3 50%, #fff 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-sm font-semibold tracking-widest text-amber-600 uppercase mb-4 block">COMO FUNCIONA</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className={`flex flex-col md:flex-row items-center gap-8 lg:gap-16 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              {/* Visual side */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-red-100 to-amber-50 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center text-white">
                        {icons[i]}
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-400 text-white font-bold flex items-center justify-center text-lg shadow-lg">
                    {step.num}
                  </div>
                </div>
              </div>
              {/* Text side */}
              <div className={`w-full md:w-1/2 ${i % 2 !== 0 ? 'md:text-right' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-lg">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg">
            <Rocket className="w-5 h-5" />
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 10: Cards com Borda Lateral Colorida ============
function Proposal10() {
  const borderColors = ['border-l-red-500', 'border-l-orange-500', 'border-l-amber-500'];
  const bgAccents = ['bg-red-50', 'bg-orange-50', 'bg-amber-50'];
  const iconBgs = ['from-red-500 to-red-500', 'from-orange-500 to-orange-600', 'from-amber-500 to-amber-600'];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400 tracking-wider">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className={`group bg-white/5 backdrop-blur-sm rounded-xl border-l-4 ${borderColors[i]} p-6 md:p-8 hover:bg-white/10 transition-colors duration-300 flex flex-col md:flex-row items-start gap-6`}>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconBgs[i]} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {icons[i]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-gray-500 bg-white/10 px-2.5 py-1 rounded-full">PASSO {step.num}</span>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-transform duration-300 hidden md:block mt-2" />
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-lg">
            <Rocket className="w-5 h-5" />
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 11: Glassmorphism com Fundo Gradiente Roxo ============
function Proposal11() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)' }}>
      {/* Floating circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-6">
            <Clock className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-semibold text-emerald-300 tracking-wider">COMO FUNCIONA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Pronto para vender em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">menos de 10 minutos</span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 hover:bg-white/20 transition-all duration-500 h-full text-center relative overflow-hidden">
                {/* Step number watermark */}
                <div className="absolute top-4 right-6 text-[80px] font-black text-white/5 leading-none">{step.num}</div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/20">
                    {icons[i]}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-full hover:bg-white/90 transition-colors duration-300 shadow-xl">
            <Rocket className="w-5 h-5" />
            Começar agora — é grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 12: Estilo Magazine / Editorial ============
function Proposal12() {
  return (
    <section className="py-20 lg:py-28 bg-[#f5f0eb] relative overflow-hidden">
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-b from-transparent to-red-300" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-semibold tracking-[0.3em] text-red-500 uppercase mb-6 block">— COMO FUNCIONA —</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-tight mb-5" style={{ fontFamily: 'Georgia, serif' }}>
            Pronto em{" "}
            <span className="font-bold italic text-red-500">10 minutos</span>
          </h2>
          <div className="w-16 h-[2px] bg-red-500 mx-auto mt-6 mb-6" />
          <p className="text-lg text-gray-500 leading-relaxed">
            Sem técnico, sem instalação, sem complicação. Você configura tudo pelo celular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {steps.map((step, i) => (
            <div key={i} className={`group p-10 text-center ${i < steps.length - 1 ? 'md:border-r border-b md:border-b-0 border-gray-200' : ''} hover:bg-red-50/30 transition-colors duration-300`}>
              {/* Elegant number */}
              <div className="text-5xl font-light text-red-200 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                0{step.num}
              </div>
              
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                {icons[i]}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3 tracking-wide uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>{step.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/register" className="inline-flex items-center gap-3 text-red-500 font-semibold text-lg hover:text-red-500 transition-colors duration-300 group">
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <p className="text-sm text-gray-400 mt-3">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </div>
    </section>
  );
}

// ============ PÁGINA DE TESTE ============
export default function HowItWorksTest() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Propostas — Seção "Como funciona"</h1>
          <Link href="/landing" className="text-sm text-red-500 hover:text-red-500 font-medium">
            ← Voltar à Landing Page
          </Link>
        </div>
      </div>

      {/* Proposals */}
      {[
        { id: 1, name: "Timeline Vertical Elegante", desc: "Cards alternados com timeline central e círculos numerados", component: <Proposal1 /> },
        { id: 2, name: "Cards com Gradiente Escuro", desc: "Fundo escuro premium com cards glassmorphism e números grandes", component: <Proposal2 /> },
        { id: 3, name: "Ícones Grandes Circulares", desc: "Círculos grandes com ícones centrais e fundo gradiente suave", component: <Proposal3 /> },
        { id: 4, name: "Números Gigantes com Cards", desc: "Números 01/02/03 em destaque com cards cinza e hover vermelho", component: <Proposal4 /> },
        { id: 5, name: "Split Layout com Preview", desc: "Lista de passos à esquerda com preview do painel à direita", component: <Proposal5 /> },
        { id: 6, name: "Minimalista com Linha", desc: "Design limpo com linha horizontal de progresso e tags", component: <Proposal6 /> },
        { id: 7, name: "Gradient Mesh Noturno", desc: "Fundo azul escuro com mesh dots, cards glassmorphism e glow rosa", component: <Proposal7 /> },
        { id: 8, name: "Fundo Vermelho Bold", desc: "Fundo vermelho vibrante com pattern, cards brancos e destaque amarelo", component: <Proposal8 /> },
        { id: 9, name: "Zig-Zag com Fundo Bege", desc: "Layout alternado com círculos concêntricos e tons quentes bege/âmbar", component: <Proposal9 /> },
        { id: 10, name: "Cards com Borda Lateral", desc: "Fundo escuro com grid sutil, cards horizontais com borda colorida degradê", component: <Proposal10 /> },
        { id: 11, name: "Glassmorphism Roxo/Verde", desc: "Gradiente roxo para verde com cards glassmorphism e números marca d'água", component: <Proposal11 /> },
        { id: 12, name: "Estilo Magazine Editorial", desc: "Fundo bege editorial com tipografia serifada, cards em grid com bordas", component: <Proposal12 /> },
      ].map((proposal) => (
        <div key={proposal.id} className="mb-2">
          {/* Proposal label */}
          <div className="bg-gray-900 text-white py-3 px-6">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                Proposta {proposal.id}
              </span>
              <div>
                <span className="font-semibold">{proposal.name}</span>
                <span className="text-gray-400 ml-3 text-sm">{proposal.desc}</span>
              </div>
            </div>
          </div>

          {/* Proposal content */}
          {proposal.component}
        </div>
      ))}
    </div>
  );
}
