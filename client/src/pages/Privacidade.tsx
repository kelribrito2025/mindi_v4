import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, ChevronDown, Database, Eye, UserCheck, Lock,
  Bell, Trash2, Mail, Globe, UtensilsCrossed, Cookie,
  Baby, Plane, ArrowLeft, FileText
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

function RightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
      <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default function Privacidade() {
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

      {/* Right side - Privacy content */}
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
            Política de Privacidade
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
                  O <strong className="text-gray-900">Mindi</strong> respeita a sua privacidade e está comprometido em proteger os dados pessoais que você nos confia. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações, em conformidade com a <strong className="text-gray-900">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/18)</strong> e demais legislações aplicáveis. <span onClick={() => setIntroExpanded(false)} className="text-red-500 font-medium hover:text-red-500 transition-colors cursor-pointer">Ler menos</span>
                </>
              ) : (
                <>
                  O <strong className="text-gray-900">Mindi</strong> respeita a sua privacidade e está comprometido em proteger os dados pessoais que você nos confia. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos...{" "}<span onClick={() => setIntroExpanded(true)} className="text-red-500 font-medium hover:text-red-500 transition-colors cursor-pointer">Ler mais</span>
                </>
              )}
            </p>
          </div>

          {/* 1. Dados que Coletamos */}
          <AccordionItem
            icon={<Database className="h-4 w-4" />}
            title="1. Dados que Coletamos"
            isOpen={openSections.has(1)}
            onToggle={() => toggleSection(1)}
          >
            <p className="text-gray-600">
              O <strong>{appName}</strong> é uma plataforma de gestão de cardápio digital e pedidos online. Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços.
            </p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1 text-sm">1.1. Dados fornecidos pelo usuário</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 text-sm">
              <li><strong>Dados de cadastro:</strong> Nome, e-mail, telefone, senha</li>
              <li><strong>Dados do estabelecimento:</strong> Nome, endereço, logotipo, CNPJ</li>
              <li><strong>Conteúdo do cardápio:</strong> Produtos, categorias, preços, descrições, imagens</li>
              <li><strong>Dados de pedidos:</strong> Histórico de pedidos, endereços de entrega, preferências de pagamento</li>
              <li><strong>Comunicações:</strong> Mensagens enviadas ao suporte, avaliações, comentários</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1 text-sm">1.2. Dados coletados automaticamente</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 text-sm">
              <li><strong>Dados de navegação:</strong> Endereço IP, tipo de navegador, sistema operacional, páginas acessadas</li>
              <li><strong>Dados de dispositivo:</strong> Modelo do dispositivo, identificadores únicos, resolução de tela</li>
              <li><strong>Dados de localização:</strong> Localização aproximada (baseada no IP) para funcionalidades de delivery</li>
              <li><strong>Cookies e tecnologias similares:</strong> Conforme descrito na seção 7 desta Política</li>
              <li><strong>Dados de uso:</strong> Funcionalidades utilizadas, cliques, interações, relatórios gerados</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1 text-sm">1.3. Dados de terceiros</h4>
            <p className="text-gray-600 text-sm">
              Podemos receber dados de parceiros de integração (iFood, Stripe) quando Você ativa essas integrações, incluindo: dados de pedidos sincronizados, status de pagamentos e informações de transações.
            </p>
          </AccordionItem>

          {/* 2. Como Utilizamos seus Dados */}
          <AccordionItem
            icon={<Eye className="h-4 w-4" />}
            title="2. Como Utilizamos seus Dados"
            isOpen={openSections.has(2)}
            onToggle={() => toggleSection(2)}
          >
            <p className="text-gray-600 text-sm mb-3">
              Utilizamos seus dados pessoais para as seguintes finalidades, sempre com base legal adequada (LGPD, art. 7º):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b">Finalidade</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b">Base legal</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Criação e gestão da conta</td><td className="py-2 px-3">Execução de contrato</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Prestação dos serviços (cardápio, pedidos, delivery)</td><td className="py-2 px-3">Execução de contrato</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Processamento de pagamentos e cobranças</td><td className="py-2 px-3">Execução de contrato</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Envio de notificações sobre pedidos e status</td><td className="py-2 px-3">Execução de contrato</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Geração de relatórios e analytics</td><td className="py-2 px-3">Execução de contrato</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Funcionalidades de IA (descrições, sugestões)</td><td className="py-2 px-3">Consentimento</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Envio de comunicações de marketing</td><td className="py-2 px-3">Legítimo interesse / Consentimento</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Melhoria e personalização da Plataforma</td><td className="py-2 px-3">Legítimo interesse</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Prevenção de fraudes e segurança</td><td className="py-2 px-3">Legítimo interesse</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3">Cumprimento de obrigações legais e regulatórias</td><td className="py-2 px-3">Obrigação legal</td></tr>
                  <tr><td className="py-2 px-3">Programas de fidelidade e cashback</td><td className="py-2 px-3">Execução de contrato</td></tr>
                </tbody>
              </table>
            </div>
          </AccordionItem>

          {/* 3. Compartilhamento de Dados */}
          <AccordionItem
            icon={<UserCheck className="h-4 w-4" />}
            title="3. Compartilhamento de Dados"
            isOpen={openSections.has(3)}
            onToggle={() => toggleSection(3)}
          >
            <p className="text-gray-600 text-sm">
              O {appName} <strong>não vende, aluga ou comercializa</strong> seus dados pessoais. Compartilhamos informações apenas nas seguintes situações:
            </p>
            <div className="space-y-2 mt-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Processadores de pagamento</h4>
                <p className="text-sm text-gray-600 mt-0.5">Stripe — para processamento de cobranças, pagamentos via cartão e PIX.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Integrações ativadas pelo Usuário</h4>
                <p className="text-xs text-gray-600 mt-0.5">Quando Você ativa integrações (iFood, etc.), dados de cardápio e pedidos são compartilhados com esses serviços conforme necessário para a funcionalidade.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Provedores de infraestrutura</h4>
                <p className="text-sm text-gray-600 mt-0.5">Serviços de hospedagem, banco de dados e CDN que processam dados em nosso nome, sob contratos de proteção de dados (DPA).</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Serviços de geolocalização</h4>
                <p className="text-sm text-gray-600 mt-0.5">Google Maps — utilizado para geocodificação de endereços, exibição de mapas e cálculo de distâncias para funcionalidades de delivery. Ao utilizar recursos de mapa, seu endereço e coordenadas geográficas podem ser compartilhados com o Google. Consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-500 underline">Política de Privacidade do Google</a> para mais informações.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Provedores de IA</h4>
                <p className="text-sm text-gray-600 mt-0.5">Quando Você utiliza funcionalidades de IA (geração de descrições, sugestões), os prompts são enviados a provedores de modelos de linguagem. Não incluímos dados pessoais identificáveis nos prompts.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm">Obrigações legais</h4>
                <p className="text-sm text-gray-600 mt-0.5">Quando exigido por lei, ordem judicial, investigação policial ou para proteger direitos, propriedade ou segurança do {appName} e seus usuários.</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-400">
                <h4 className="font-semibold text-gray-900 text-sm">Entre restaurante e consumidor</h4>
                <p className="text-sm text-gray-600 mt-0.5">Quando um consumidor faz um pedido, o restaurante recebe os dados necessários para a entrega (nome, telefone, endereço). O restaurante é responsável por proteger esses dados conforme a LGPD.</p>
              </div>
            </div>
          </AccordionItem>

          {/* 4. Segurança dos Dados */}
          <AccordionItem
            icon={<Lock className="h-4 w-4" />}
            title="4. Segurança dos Dados"
            isOpen={openSections.has(4)}
            onToggle={() => toggleSection(4)}
          >
            <p className="text-gray-600 text-sm">
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Criptografia em trânsito:</strong> Todas as comunicações utilizam TLS 1.2+ (HTTPS)</li>
              <li><strong>Criptografia em repouso:</strong> Dados armazenados em bancos de dados com criptografia AES-256</li>
              <li><strong>Controle de acesso:</strong> Políticas de segurança garantem que cada usuário acesse apenas seus próprios dados</li>
              <li><strong>Autenticação segura:</strong> Senhas armazenadas com hashing bcrypt, suporte a autenticação multifator</li>
              <li><strong>Monitoramento:</strong> Logs de auditoria para ações sensíveis e detecção de atividades suspeitas</li>
              <li><strong>Backups:</strong> Backups automáticos diários com retenção de 30 dias</li>
              <li><strong>Dados de pagamento:</strong> Processados exclusivamente pelo Stripe (certificação PCI DSS Nível 1) — não armazenamos números de cartão</li>
            </ul>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-3">
              <p className="text-sm text-amber-800">
                Embora adotemos as melhores práticas de segurança, nenhum sistema é 100% inviolável. Em caso de incidente de segurança que envolva dados pessoais, notificaremos os titulares afetados e a ANPD conforme determina a LGPD (art. 48).
              </p>
            </div>
          </AccordionItem>

          {/* 5. Seus Direitos (LGPD) */}
          <AccordionItem
            icon={<Shield className="h-4 w-4" />}
            title="5. Seus Direitos (LGPD)"
            isOpen={openSections.has(5)}
            onToggle={() => toggleSection(5)}
          >
            <p className="text-gray-600 text-sm">
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/18), Você, como titular dos dados, tem os seguintes direitos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <RightCard title="Confirmação e acesso" description="Confirmar se tratamos seus dados e acessar uma cópia deles." />
              <RightCard title="Correção" description="Solicitar a correção de dados incompletos, inexatos ou desatualizados." />
              <RightCard title="Anonimização ou bloqueio" description="Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos." />
              <RightCard title="Portabilidade" description="Solicitar a portabilidade dos seus dados a outro fornecedor de serviço." />
              <RightCard title="Eliminação" description="Solicitar a eliminação dos dados tratados com base no seu consentimento." />
              <RightCard title="Informação sobre compartilhamento" description="Ser informado sobre entidades públicas e privadas com as quais compartilhamos seus dados." />
              <RightCard title="Revogação do consentimento" description="Revogar o consentimento a qualquer momento, sem afetar a licitude do tratamento anterior." />
              <RightCard title="Oposição" description="Opor-se ao tratamento realizado com base em legítimo interesse, caso aplicável." />
              <RightCard title="Revisão de decisões automatizadas" description="Solicitar revisão de decisões tomadas exclusivamente com base em tratamento automatizado." />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Para exercer qualquer um desses direitos, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail{" "}
              <a href="mailto:privacidade@mindi.com.br" className="text-red-500 hover:underline font-medium">privacidade@mindi.com.br</a>.
              Responderemos sua solicitação em até 15 dias úteis.
            </p>
          </AccordionItem>

          {/* 6. Retenção e Exclusão de Dados */}
          <AccordionItem
            icon={<Trash2 className="h-4 w-4" />}
            title="6. Retenção e Exclusão de Dados"
            isOpen={openSections.has(6)}
            onToggle={() => toggleSection(6)}
          >
            <p className="text-gray-600 text-sm">
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, incluindo obrigações legais, contábeis e fiscais. Os períodos de retenção são:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Dados de conta:</strong> Mantidos enquanto a conta estiver ativa. Após solicitação de exclusão, os dados são removidos em até 30 dias, exceto quando houver obrigação legal de retenção.</li>
              <li><strong>Dados de pedidos:</strong> Mantidos por 5 anos para fins fiscais e contábeis, conforme legislação brasileira.</li>
              <li><strong>Dados de pagamento:</strong> Gerenciados pelo Stripe conforme sua própria política de retenção. Não armazenamos dados de cartão de crédito.</li>
              <li><strong>Logs de acesso:</strong> Mantidos por 6 meses conforme o Marco Civil da Internet (Lei nº 12.965/2014).</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Ao solicitar a exclusão da sua conta, removeremos ou anonimizaremos seus dados pessoais, mantendo apenas o que for legalmente necessário.
            </p>
          </AccordionItem>

          {/* 7. Cookies e Tecnologias de Rastreamento */}
          <AccordionItem
            icon={<Cookie className="h-4 w-4" />}
            title="7. Cookies e Tecnologias de Rastreamento"
            isOpen={openSections.has(7)}
            onToggle={() => toggleSection(7)}
          >
            <p className="text-gray-600 text-sm">Utilizamos cookies e tecnologias similares para:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1 mt-2 text-sm">
              <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento da plataforma, como manutenção de sessão de login e preferências do usuário.</li>
              <li><strong>Cookies de desempenho:</strong> Coletam informações anônimas sobre como os usuários utilizam a plataforma para fins de melhoria.</li>
              <li><strong>Armazenamento local (localStorage):</strong> Utilizado para salvar preferências de interface, como tema (claro/escuro) e configurações de impressão.</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Você pode gerenciar as configurações de cookies através do seu navegador. No entanto, desabilitar cookies essenciais pode afetar o funcionamento adequado da plataforma.
            </p>
          </AccordionItem>

          {/* 8. Dados de Menores */}
          <AccordionItem
            icon={<Baby className="h-4 w-4" />}
            title="8. Dados de Menores"
            isOpen={openSections.has(8)}
            onToggle={() => toggleSection(8)}
          >
            <p className="text-gray-600 text-sm">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados pessoais de crianças ou adolescentes. Caso tomemos conhecimento de que dados de um menor foram coletados sem o consentimento dos pais ou responsáveis legais, tomaremos as medidas necessárias para excluí-los de nossos sistemas.
            </p>
          </AccordionItem>

          {/* 9. Transferência Internacional de Dados */}
          <AccordionItem
            icon={<Plane className="h-4 w-4" />}
            title="9. Transferência Internacional de Dados"
            isOpen={openSections.has(9)}
            onToggle={() => toggleSection(9)}
          >
            <p className="text-gray-600 text-sm">
              Alguns de nossos provedores de serviço podem estar localizados fora do Brasil. Nesses casos, garantimos que a transferência internacional de dados ocorra em conformidade com a LGPD, adotando cláusulas contratuais padrão e verificando que os países de destino ofereçam nível adequado de proteção de dados ou que existam garantias suficientes.
            </p>
          </AccordionItem>

          {/* 10. Contato e Encarregado (DPO) */}
          <AccordionItem
            icon={<Mail className="h-4 w-4" />}
            title="10. Contato e Encarregado (DPO)"
            isOpen={openSections.has(10)}
            onToggle={() => toggleSection(10)}
          >
            <p className="text-gray-600 text-sm">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento dos seus dados pessoais, entre em contato conosco:
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Encarregado de Proteção de Dados (DPO)</p>
                    <p className="text-sm font-medium text-gray-900">Francisco Brito</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">E-mail do DPO</p>
                    <a href="mailto:privacidade@mindi.com.br" className="text-sm font-medium text-gray-900 hover:text-red-500 transition-colors">privacidade@mindi.com.br</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Plataforma</p>
                    <p className="text-sm font-medium text-gray-900">{appName}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Responderemos às suas solicitações no prazo de até 15 dias úteis, conforme previsto na LGPD.
            </p>
          </AccordionItem>

          {/* Footer */}
          <div className="pt-3 pb-1 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
            </p>
            <p className="text-[0.7rem] text-red-500 mt-0.5">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
