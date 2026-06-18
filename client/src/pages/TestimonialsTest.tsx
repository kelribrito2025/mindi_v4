import { Link } from "wouter";
import { Star, Quote, MessageCircle, Heart, ThumbsUp, ChevronLeft, ChevronRight } from "lucide-react";

// Dados compartilhados entre todas as propostas
const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Dono do Burger House",
    text: "Reduzi 90% dos erros de pedido e aumentei o ticket médio em 35%. O Mindi transformou minha operação.",
    stars: 5,
    initials: "CM",
  },
  {
    name: "Ana Paula",
    role: "Gerente do Sushi Kento",
    text: "Saímos do iFood e economizamos mais de R$3.000/mês em taxas. Os clientes adoram pedir pelo nosso cardápio.",
    stars: 5,
    initials: "AP",
  },
  {
    name: "Roberto Silva",
    role: "Dono da Pizzaria Napoli",
    text: "O programa de fidelidade aumentou a recorrência em 40%. Clientes voltam mais e gastam mais a cada visita.",
    stars: 5,
    initials: "RS",
  },
  {
    name: "Fernanda Lima",
    role: "Dona do Café Aroma",
    text: "Em 2 semanas já tinha o cardápio digital rodando. O QR Code nas mesas agilizou tudo, sem precisar de garçom para anotar.",
    stars: 5,
    initials: "FL",
  },
  {
    name: "Marcos Oliveira",
    role: "Dono do Espetinho do Marcos",
    text: "O robô no WhatsApp atende meus clientes 24h. Acordo com pedidos prontos pra preparar. Nunca vendi tanto!",
    stars: 5,
    initials: "MO",
  },
  {
    name: "Juliana Costa",
    role: "Gerente do Restaurante Sabor & Arte",
    text: "O painel de gestão me dá visão total do negócio. Sei exatamente o que vende mais e em qual horário. Dados que antes eu não tinha.",
    stars: 5,
    initials: "JC",
  },
];

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
    ))}
  </div>
);

const Avatar = ({ initials, gradient }: { initials: string; gradient: string }) => (
  <div className={`w-12 h-12 rounded-full ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
    {initials}
  </div>
);

const gradients = [
  "bg-gradient-to-br from-red-400 to-orange-400",
  "bg-gradient-to-br from-blue-400 to-indigo-400",
  "bg-gradient-to-br from-green-400 to-emerald-400",
  "bg-gradient-to-br from-purple-400 to-pink-400",
  "bg-gradient-to-br from-amber-400 to-yellow-400",
  "bg-gradient-to-br from-teal-400 to-cyan-400",
];

// ============ PROPOSTA 1: Grid Clássico com Estrelas (6 cards, 3x2) ============
function TestimonialP1() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-red-50 text-red-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-red-100">DEPOIMENTOS</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Quem usa, <span className="text-red-500">recomenda.</span>
          </h2>
          <p className="text-lg text-gray-500">Veja o que nossos clientes dizem sobre o Mindi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 group">
              <div className="flex items-center justify-between mb-5">
                <StarRating count={t.stars} />
                <Quote className="w-8 h-8 text-red-100 group-hover:text-red-200 transition-colors" />
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <Avatar initials={t.initials} gradient={gradients[i]} />
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 2: Masonry Assimétrico (tamanhos variados) ============
function TestimonialP2() {
  return (
    <section className="py-20 lg:py-28 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-white/10 text-red-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/10">DEPOIMENTOS</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Quem usa, <span className="text-red-400">recomenda.</span>
          </h2>
          <p className="text-lg text-gray-400">Veja o que nossos clientes dizem sobre o Mindi.</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <div key={i} className="break-inside-avoid bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors duration-300">
              <div className="flex gap-1 mb-4">
                <StarRating count={t.stars} />
              </div>
              <p className={`text-gray-300 leading-relaxed mb-6 ${i % 3 === 1 ? 'text-lg' : 'text-sm'}`}>"{t.text}"</p>
              <div className="flex items-center gap-3">
                <Avatar initials={t.initials} gradient={gradients[i]} />
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 3: Estilo Tweets / Redes Sociais ============
function TestimonialP3() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            O que estão <span className="text-blue-500">dizendo</span>
          </h2>
          <p className="text-lg text-gray-500">Feedback real de donos de restaurante que usam o Mindi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-[colors,box-shadow] duration-300">
              <div className="flex items-start gap-3 mb-3">
                <Avatar initials={t.initials} gradient={gradients[i]} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <svg className="w-4 h-4 text-blue-500 fill-blue-500" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  </div>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-gray-700 leading-relaxed text-sm mb-3">{t.text}</p>
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
                  <Heart className="w-3.5 h-3.5" /> {12 + i * 7}
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> {3 + i}
                </button>
                <div className="ml-auto">
                  <StarRating count={t.stars} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 4: Cards Horizontais com Destaque ============
function TestimonialP4() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
          <div>
            <span className="text-red-500 font-semibold text-sm tracking-wider uppercase mb-3 block">Depoimentos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Quem usa,<br /><span className="text-red-500">recomenda.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-md text-lg">Mais de 500 restaurantes já transformaram sua operação com o Mindi.</p>
        </div>

        {/* Card destaque grande */}
        <div className="bg-gradient-to-br from-red-500 to-red-500 rounded-3xl p-8 lg:p-12 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <Quote className="w-12 h-12 text-white/30 mb-6" />
            <p className="text-xl lg:text-2xl font-medium leading-relaxed mb-8 max-w-3xl">"{testimonials[0].text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{testimonials[0].initials}</div>
              <div>
                <p className="font-bold text-lg">{testimonials[0].name}</p>
                <p className="text-white/70">{testimonials[0].role}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de cards menores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.slice(1).map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-[colors,box-shadow] duration-300">
              <StarRating count={t.stars} />
              <p className="text-gray-600 leading-relaxed my-5 text-sm">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <Avatar initials={t.initials} gradient={gradients[i + 1]} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 5: Carrossel Horizontal com Fundo Gradiente ============
function TestimonialP5() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-red-50 via-white to-red-50/60 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(239,68,68,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-white text-red-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-red-100 shadow-sm">
            <ThumbsUp className="w-4 h-4" /> AVALIAÇÕES REAIS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Quem usa, <span className="text-red-500">recomenda.</span>
          </h2>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {testimonials.map((t, i) => (
            <div key={i} className="min-w-[320px] max-w-[360px] bg-white rounded-2xl border border-gray-100 p-7 shadow-md snap-center shrink-0 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <StarRating count={t.stars} />
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">{t.stars}.0</span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <Avatar initials={t.initials} gradient={gradients[i]} />
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
                <Quote className="w-8 h-8 text-red-100 ml-auto" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 6: Layout Bento Grid ============
function TestimonialP6() {
  return (
    <section className="py-20 lg:py-28 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Quem usa, <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">recomenda.</span>
          </h2>
          <p className="text-lg text-gray-400">Histórias reais de quem já transformou seu restaurante.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-auto">
          {/* Card grande - span 2 cols */}
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-2xl border border-red-500/20 p-8">
            <Quote className="w-10 h-10 text-red-400/40 mb-4" />
            <p className="text-lg text-gray-200 leading-relaxed mb-6">"{testimonials[0].text}"</p>
            <div className="flex items-center gap-3">
              <Avatar initials={testimonials[0].initials} gradient={gradients[0]} />
              <div>
                <p className="font-semibold">{testimonials[0].name}</p>
                <p className="text-sm text-gray-400">{testimonials[0].role}</p>
              </div>
            </div>
            <div className="mt-4"><StarRating count={5} /></div>
          </div>

          {/* Card médio */}
          <div className="md:col-span-2 lg:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-8">
            <Quote className="w-10 h-10 text-white/10 mb-4" />
            <p className="text-lg text-gray-200 leading-relaxed mb-6">"{testimonials[1].text}"</p>
            <div className="flex items-center gap-3">
              <Avatar initials={testimonials[1].initials} gradient={gradients[1]} />
              <div>
                <p className="font-semibold">{testimonials[1].name}</p>
                <p className="text-sm text-gray-400">{testimonials[1].role}</p>
              </div>
            </div>
            <div className="mt-4"><StarRating count={5} /></div>
          </div>

          {/* Cards menores */}
          {testimonials.slice(2).map((t, i) => (
            <div key={i} className="md:col-span-2 lg:col-span-3 xl:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
              <StarRating count={t.stars} />
              <p className="text-gray-300 leading-relaxed my-4 text-sm">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <Avatar initials={t.initials} gradient={gradients[i + 2]} />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 7: Minimalista com Aspas Grandes ============
function TestimonialP7() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Quem usa, <span className="text-red-500">recomenda.</span>
          </h2>
        </div>

        <div className="space-y-16">
          {testimonials.slice(0, 4).map((t, i) => (
            <div key={i} className={`flex flex-col md:flex-row items-start gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className={`w-20 h-20 rounded-full ${gradients[i]} flex items-center justify-center text-white font-bold text-2xl`}>
                  {t.initials}
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
                <StarRating count={t.stars} />
              </div>
              <div className="flex-1 relative">
                <span className="text-[120px] font-serif text-red-100 absolute -top-12 -left-4 leading-none select-none">"</span>
                <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed relative z-10 pt-6 pl-8">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 8: Cards com Foto de Fundo e Overlay ============
function TestimonialP8() {
  const bgColors = [
    "from-red-500 to-red-500",
    "from-blue-600 to-blue-800",
    "from-emerald-600 to-emerald-800",
    "from-purple-600 to-purple-800",
    "from-amber-600 to-amber-800",
    "from-teal-600 to-teal-800",
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded-full mb-5">DEPOIMENTOS</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Quem usa, <span className="text-red-500">recomenda.</span>
          </h2>
          <p className="text-lg text-gray-500">Histórias reais de donos de restaurante.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className={`bg-gradient-to-br ${bgColors[i]} rounded-2xl p-7 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              <div className="relative z-10">
                <Quote className="w-10 h-10 text-white/20 mb-4" />
                <StarRating count={t.stars} />
                <p className="text-white/90 leading-relaxed my-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/20">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{t.initials}</div>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-white/60 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 9: Estilo Revista / Editorial com Fundo Bege ============
function TestimonialP9() {
  return (
    <section className="py-20 lg:py-28 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-red-500 font-medium tracking-widest uppercase text-sm mb-4">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Quem usa, <em className="text-red-500 not-italic">recomenda.</em>
          </h2>
          <div className="w-16 h-1 bg-red-500 mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.slice(0, 4).map((t, i) => (
            <div key={i} className="flex gap-6 bg-white rounded-xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="shrink-0">
                <Avatar initials={t.initials} gradient={gradients[i]} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                  <StarRating count={t.stars} />
                </div>
                <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>"{t.text}"</p>
              </div>
            </div>
          ))}
        </div>

        {/* Destaque central */}
        <div className="mt-8 bg-red-500 rounded-2xl p-8 lg:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)' }} />
          </div>
          <div className="relative z-10">
            <Quote className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-xl lg:text-2xl font-medium leading-relaxed max-w-3xl mx-auto mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              "{testimonials[4].text}"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">{testimonials[4].initials}</div>
              <div className="text-left">
                <p className="font-bold">{testimonials[4].name}</p>
                <p className="text-white/70 text-sm">{testimonials[4].role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PROPOSTA 10: Marquee Infinito com Cards Flutuantes ============
function TestimonialP10() {
  const row1 = [...testimonials, ...testimonials];
  const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white via-red-50/30 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-red-100">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" /> +500 RESTAURANTES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Quem usa, <span className="text-red-500">recomenda.</span>
          </h2>
        </div>
      </div>

      {/* Marquee Row 1 */}
      <div className="relative mb-5">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="flex gap-5 animate-marquee-left">
          {row1.map((t, i) => (
            <div key={i} className="min-w-[340px] bg-white rounded-xl border border-gray-100 p-5 shadow-sm shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <Avatar initials={t.initials} gradient={gradients[i % 6]} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
                <StarRating count={t.stars} />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Row 2 - reverse */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="flex gap-5 animate-marquee-right">
          {row2.map((t, i) => (
            <div key={i} className="min-w-[340px] bg-white rounded-xl border border-gray-100 p-5 shadow-sm shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <Avatar initials={t.initials} gradient={gradients[i % 6]} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
                <StarRating count={t.stars} />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 40s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 40s linear infinite;
        }
      `}</style>
    </section>
  );
}

// ============ PÁGINA DE TESTE ============
export default function TestimonialsTest() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Propostas — Seção "Quem usa, recomenda."</h1>
          <Link href="/landing" className="text-sm text-red-500 hover:text-red-500 font-medium">
            ← Voltar à Landing Page
          </Link>
        </div>
      </div>

      {/* Proposals */}
      {[
        { id: 1, name: "Grid Clássico com Estrelas", desc: "6 cards em grid 3x2, fundo claro, hover com elevação e aspas decorativas", component: <TestimonialP1 /> },
        { id: 2, name: "Masonry Assimétrico Escuro", desc: "Layout masonry com tamanhos variados, fundo escuro premium, glassmorphism", component: <TestimonialP2 /> },
        { id: 3, name: "Estilo Tweets / Redes Sociais", desc: "Cards estilo post de rede social com likes, comentários e verificação", component: <TestimonialP3 /> },
        { id: 4, name: "Destaque + Grid", desc: "Card grande em destaque vermelho + grid de cards menores abaixo", component: <TestimonialP4 /> },
        { id: 5, name: "Carrossel Horizontal", desc: "Cards em scroll horizontal com dots e fundo gradiente rosa/vermelho", component: <TestimonialP5 /> },
        { id: 6, name: "Bento Grid Escuro", desc: "Layout bento com cards de tamanhos variados em fundo escuro", component: <TestimonialP6 /> },
        { id: 7, name: "Minimalista com Aspas Grandes", desc: "Layout alternado com aspas gigantes decorativas e avatares grandes", component: <TestimonialP7 /> },
        { id: 8, name: "Cards Coloridos com Gradiente", desc: "Cada card com gradiente de cor diferente, pattern decorativo", component: <TestimonialP8 /> },
        { id: 9, name: "Estilo Revista Editorial", desc: "Fundo bege, tipografia serifada, cards horizontais + destaque central vermelho", component: <TestimonialP9 /> },
        { id: 10, name: "Marquee Infinito Duplo", desc: "Duas fileiras de cards em movimento contínuo (esquerda/direita), efeito fade nas bordas", component: <TestimonialP10 /> },
      ].map((proposal) => (
        <div key={proposal.id} className="mb-2">
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
          {proposal.component}
        </div>
      ))}
    </div>
  );
}
