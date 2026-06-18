import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, ChevronDown, FileText, Scale, Users, AlertTriangle,
  CreditCard, Ban, RefreshCw, Gavel, Mail, ArrowLeft, Globe,
  UtensilsCrossed, Clock
} from "lucide-react";
import { AuthLayoutBackground } from "@/components/AuthLayout";
import { useTheme } from "@/contexts/ThemeContext";

interface AccordionItemProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ icon, title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-red-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-red-50/50 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-500 rounded-lg flex-shrink-0">
          {icon}
        </div>
        <span className="font-semibold text-gray-900 text-base flex-1">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 pt-2 space-y-3 text-gray-700 leading-relaxed text-sm border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Termos() {
  const { forceTheme } = useTheme();
  const appName = "Mindi";
  const lastUpdated = "03 de janeiro de 2026";
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [introExpanded, setIntroExpanded] = useState(false);

  useEffect(() => {
    forceTheme('light');
    return () => { forceTheme(null); };
  }, [forceTheme]);

  const toggleSection = (index: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - reuse AuthLayout background */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <AuthLayoutBackground backgroundImage="https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/privacidade-bg_b1da38f6.webp" />
      </div>

      {/* Right side - Terms content */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-white flex flex-col h-screen overflow-hidden px-8 pt-8 pb-3">
        {/* Header com botão voltar e título centralizado */}
        <div className="relative flex items-center justify-center mb-1 flex-shrink-0 pt-1">
          <Link
            href="/login"
            className="absolute left-0 flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            Termos de Uso
          </h2>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3 text-[0.7rem] text-muted-foreground flex-shrink-0">
          <span>Última atualização: {lastUpdated}</span>
        </div>

        {/* Accordion scrollable */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
          {/* Texto introdutório */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-1 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {introExpanded ? (
                <>
                  Bem-vindo ao <strong className="text-gray-900">{appName}</strong>! Estes Termos de Uso regulam o acesso e a utilização da plataforma {appName}, incluindo o site, aplicativos e todos os serviços oferecidos. Ao criar uma conta ou utilizar nossos serviços, você declara que leu, compreendeu e concorda com estes Termos. Caso não concorde com alguma disposição, por favor, não utilize a plataforma. <span onClick={() => setIntroExpanded(false)} className="text-red-500 font-medium hover:text-red-500 transition-colors cursor-pointer">Ler menos</span>
                </>
              ) : (
                <>
                  Bem-vindo ao <strong className="text-gray-900">{appName}</strong>! Estes Termos de Uso regulam o acesso e a utilização da plataforma {appName}, incluindo o site, aplicativos e todos os serviços oferecidos...{" "}<span onClick={() => setIntroExpanded(true)} className="text-red-500 font-medium hover:text-red-500 transition-colors cursor-pointer">Ler mais</span>
                </>
              )}
            </p>
          </div>

          {/* 1. Definições */}
          <AccordionItem
            icon={<FileText className="h-4 w-4" />}
            title="1. Definições"
            isOpen={openSections.has(1)}
            onToggle={() => toggleSection(1)}
          >
            <p className="text-gray-600 text-sm">
              Para os fins destes Termos de Uso, consideram-se as seguintes definições:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Plataforma:</strong> O sistema {appName}, incluindo site, aplicativos e APIs.</li>
              <li><strong>Usuário Restaurante:</strong> Pessoa física ou jurídica que utiliza a Plataforma para gerenciar seu estabelecimento, cardápio, pedidos e operações.</li>
              <li><strong>Consumidor:</strong> Pessoa que acessa o cardápio digital de um restaurante e realiza pedidos através da Plataforma.</li>
              <li><strong>Conta:</strong> Registro individual do Usuário na Plataforma, protegido por credenciais de acesso.</li>
              <li><strong>Serviços:</strong> Todas as funcionalidades oferecidas pela Plataforma, incluindo cardápio digital, gestão de pedidos, controle financeiro, integrações e demais recursos.</li>
              <li><strong>Conteúdo do Usuário:</strong> Informações, textos, imagens, logotipos e demais materiais inseridos pelo Usuário na Plataforma.</li>
            </ul>
          </AccordionItem>

          {/* 2. Aceitação dos Termos */}
          <AccordionItem
            icon={<Scale className="h-4 w-4" />}
            title="2. Aceitação dos Termos"
            isOpen={openSections.has(2)}
            onToggle={() => toggleSection(2)}
          >
            <p className="text-gray-600 text-sm">
              Ao acessar ou utilizar a Plataforma, você concorda integralmente com estes Termos de Uso e com nossa <Link href="/privacidade" className="text-red-500 hover:text-red-500 underline">Política de Privacidade</Link>. Estes Termos constituem um contrato vinculante entre você e o {appName}.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na Plataforma com antecedência mínima de 30 dias. O uso continuado da Plataforma após a notificação constitui aceitação dos novos Termos.
            </p>
          </AccordionItem>

          {/* 3. Cadastro e Conta */}
          <AccordionItem
            icon={<Users className="h-4 w-4" />}
            title="3. Cadastro e Conta"
            isOpen={openSections.has(3)}
            onToggle={() => toggleSection(3)}
          >
            <p className="text-gray-600 text-sm">
              Para utilizar os Serviços, o Usuário Restaurante deve criar uma Conta fornecendo informações verdadeiras, completas e atualizadas. O Usuário é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li>Manter a confidencialidade de suas credenciais de acesso (e-mail e senha).</li>
              <li>Todas as atividades realizadas em sua Conta.</li>
              <li>Notificar imediatamente o {appName} sobre qualquer uso não autorizado de sua Conta.</li>
              <li>Manter seus dados cadastrais atualizados.</li>
            </ul>
            <p className="text-gray-600 text-sm mt-2">
              O {appName} reserva-se o direito de recusar, suspender ou cancelar Contas que violem estes Termos ou que apresentem informações falsas ou fraudulentas.
            </p>
          </AccordionItem>

          {/* 4. Serviços e Funcionalidades */}
          <AccordionItem
            icon={<UtensilsCrossed className="h-4 w-4" />}
            title="4. Serviços e Funcionalidades"
            isOpen={openSections.has(4)}
            onToggle={() => toggleSection(4)}
          >
            <p className="text-gray-600 text-sm">
              O {appName} oferece uma plataforma de gestão para restaurantes que inclui, entre outras funcionalidades:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Cardápio digital:</strong> Criação e gestão de cardápios online com categorias, produtos, variações e complementos.</li>
              <li><strong>Gestão de pedidos:</strong> Recebimento, acompanhamento e gerenciamento de pedidos via WhatsApp, balcão e delivery.</li>
              <li><strong>Controle financeiro:</strong> Registro de receitas, despesas, fluxo de caixa e relatórios financeiros.</li>
              <li><strong>Integrações:</strong> Conexão com plataformas de terceiros (iFood, Stripe, WhatsApp) para ampliar funcionalidades.</li>
              <li><strong>Gestão de estoque:</strong> Controle de insumos, fichas técnicas e alertas de estoque baixo.</li>
              <li><strong>Painel de cozinha (KDS):</strong> Visualização e gerenciamento de pedidos em tempo real na cozinha.</li>
              <li><strong>Funcionalidades de IA:</strong> Geração automática de descrições, sugestões de preços e análises inteligentes.</li>
            </ul>
            <p className="text-gray-600 text-sm mt-2">
              Os Serviços podem ser atualizados, modificados ou descontinuados a qualquer momento, mediante aviso prévio quando possível. Algumas funcionalidades podem estar disponíveis apenas em planos específicos.
            </p>
          </AccordionItem>

          {/* 5. Planos e Pagamentos */}
          <AccordionItem
            icon={<CreditCard className="h-4 w-4" />}
            title="5. Planos e Pagamentos"
            isOpen={openSections.has(5)}
            onToggle={() => toggleSection(5)}
          >
            <p className="text-gray-600 text-sm">
              O {appName} oferece diferentes planos de assinatura, incluindo um plano gratuito com funcionalidades limitadas e planos pagos com recursos adicionais.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Cobrança:</strong> Os planos pagos são cobrados mensalmente ou anualmente, conforme a opção escolhida pelo Usuário.</li>
              <li><strong>Processamento:</strong> Os pagamentos são processados pelo Stripe, nosso parceiro de pagamentos. O {appName} não armazena dados de cartão de crédito.</li>
              <li><strong>Renovação automática:</strong> As assinaturas são renovadas automaticamente ao final de cada período, salvo cancelamento prévio.</li>
              <li><strong>Cancelamento:</strong> O Usuário pode cancelar sua assinatura a qualquer momento. O acesso aos recursos do plano pago permanece ativo até o final do período já pago.</li>
              <li><strong>Reembolso:</strong> Não há reembolso proporcional para períodos não utilizados, exceto nos casos previstos pelo Código de Defesa do Consumidor.</li>
              <li><strong>Alteração de preços:</strong> Reservamo-nos o direito de alterar os preços dos planos, com aviso prévio de 30 dias. Alterações não afetam o período de assinatura em curso.</li>
            </ul>
          </AccordionItem>

          {/* 6. Responsabilidades do Usuário */}
          <AccordionItem
            icon={<AlertTriangle className="h-4 w-4" />}
            title="6. Responsabilidades do Usuário"
            isOpen={openSections.has(6)}
            onToggle={() => toggleSection(6)}
          >
            <p className="text-gray-600 text-sm">
              Ao utilizar a Plataforma, o Usuário compromete-se a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li>Utilizar a Plataforma de forma lícita e em conformidade com a legislação brasileira aplicável.</li>
              <li>Não utilizar a Plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros.</li>
              <li>Garantir que o Conteúdo do Usuário (cardápio, imagens, descrições) não viole direitos autorais, marcas registradas ou outros direitos de propriedade intelectual de terceiros.</li>
              <li>Manter informações precisas sobre produtos, preços e disponibilidade em seu cardápio.</li>
              <li>Cumprir todas as normas sanitárias, fiscais e regulatórias aplicáveis ao seu estabelecimento.</li>
              <li>Tratar os dados pessoais dos Consumidores em conformidade com a LGPD.</li>
              <li>Não realizar engenharia reversa, descompilar ou tentar acessar o código-fonte da Plataforma.</li>
              <li>Não utilizar bots, scrapers ou ferramentas automatizadas para acessar a Plataforma sem autorização.</li>
            </ul>
          </AccordionItem>

          {/* 7. Propriedade Intelectual */}
          <AccordionItem
            icon={<Shield className="h-4 w-4" />}
            title="7. Propriedade Intelectual"
            isOpen={openSections.has(7)}
            onToggle={() => toggleSection(7)}
          >
            <p className="text-gray-600 text-sm">
              Todos os direitos de propriedade intelectual sobre a Plataforma, incluindo software, design, marcas, logotipos, textos e demais elementos, pertencem exclusivamente ao {appName} ou a seus licenciadores.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              O Usuário mantém a titularidade sobre o Conteúdo do Usuário inserido na Plataforma. Ao inserir conteúdo, o Usuário concede ao {appName} uma licença não exclusiva, mundial e gratuita para utilizar, reproduzir e exibir tal conteúdo exclusivamente para a prestação dos Serviços.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              A utilização da Plataforma não confere ao Usuário qualquer direito de propriedade intelectual sobre os Serviços ou sobre o conteúdo acessado.
            </p>
          </AccordionItem>

          {/* 8. Limitação de Responsabilidade */}
          <AccordionItem
            icon={<Ban className="h-4 w-4" />}
            title="8. Limitação de Responsabilidade"
            isOpen={openSections.has(8)}
            onToggle={() => toggleSection(8)}
          >
            <p className="text-gray-600 text-sm">
              O {appName} se esforça para manter a Plataforma disponível e funcionando corretamente, mas não garante disponibilidade ininterrupta ou ausência de erros.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li>O {appName} não se responsabiliza por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso da Plataforma.</li>
              <li>O {appName} não é parte nas transações entre Usuários Restaurante e Consumidores, não se responsabilizando pela qualidade dos produtos, entrega ou atendimento.</li>
              <li>A responsabilidade total do {appName} está limitada ao valor pago pelo Usuário nos últimos 12 meses de assinatura.</li>
              <li>O {appName} não se responsabiliza por falhas em serviços de terceiros integrados (iFood, Stripe, WhatsApp, etc.).</li>
            </ul>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-3">
              <p className="text-sm text-amber-800">
                Nenhuma disposição nestes Termos exclui ou limita responsabilidades que não possam ser excluídas ou limitadas pela legislação brasileira aplicável, incluindo o Código de Defesa do Consumidor.
              </p>
            </div>
          </AccordionItem>

          {/* 9. Suspensão e Encerramento */}
          <AccordionItem
            icon={<RefreshCw className="h-4 w-4" />}
            title="9. Suspensão e Encerramento"
            isOpen={openSections.has(9)}
            onToggle={() => toggleSection(9)}
          >
            <p className="text-gray-600 text-sm">
              O {appName} pode suspender ou encerrar o acesso do Usuário à Plataforma nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li>Violação destes Termos de Uso ou da Política de Privacidade.</li>
              <li>Inadimplência no pagamento das assinaturas.</li>
              <li>Uso fraudulento ou abusivo da Plataforma.</li>
              <li>Solicitação de autoridades competentes.</li>
              <li>Inatividade prolongada da Conta (superior a 12 meses).</li>
            </ul>
            <p className="text-gray-600 text-sm mt-2">
              O Usuário pode solicitar o encerramento de sua Conta a qualquer momento através das configurações da Plataforma ou por e-mail. Após o encerramento, os dados serão tratados conforme nossa Política de Privacidade.
            </p>
          </AccordionItem>

          {/* 10. Disposições Gerais */}
          <AccordionItem
            icon={<Gavel className="h-4 w-4" />}
            title="10. Disposições Gerais"
            isOpen={openSections.has(10)}
            onToggle={() => toggleSection(10)}
          >
            <p className="text-gray-600 text-sm">
              <strong>Lei aplicável:</strong> Estes Termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              <strong>Foro:</strong> Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes destes Termos, ressalvado o direito do consumidor de optar pelo foro de seu domicílio.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              <strong>Independência das cláusulas:</strong> Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              <strong>Cessão:</strong> O Usuário não pode ceder ou transferir seus direitos e obrigações sob estes Termos sem o consentimento prévio e por escrito do {appName}.
            </p>
          </AccordionItem>

          {/* 11. Contato */}
          <AccordionItem
            icon={<Mail className="h-4 w-4" />}
            title="11. Contato"
            isOpen={openSections.has(11)}
            onToggle={() => toggleSection(11)}
          >
            <p className="text-gray-600 text-sm">
              Se você tiver dúvidas ou sugestões sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Plataforma</p>
                    <p className="text-sm font-medium text-gray-900">{appName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">E-mail</p>
                    <a href="mailto:contato@mindi.com.br" className="text-sm font-medium text-gray-900 hover:text-red-500 transition-colors">contato@mindi.com.br</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a href="https://mindi.com.br" className="text-sm font-medium text-gray-900 hover:text-red-500 transition-colors">mindi.com.br</a>
                  </div>
                </div>
              </div>
            </div>
          </AccordionItem>

          {/* Footer */}
          <div className="pt-3 pb-1 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
            </p>
            <p className="text-[0.7rem] text-red-500 mt-0.5">
              Estes Termos de Uso estão em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Marco Civil da Internet (Lei nº 12.965/2014).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
