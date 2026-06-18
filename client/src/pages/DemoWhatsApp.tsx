import { useEffect, useState } from "react";

interface DemoWhatsAppProps {
  embedded?: boolean;
}

export default function DemoWhatsApp({ embedded }: DemoWhatsAppProps) {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (!embedded) {
      document.body.style.overflow = "hidden";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
    };
  }, [embedded]);

  // Animate messages appearing one by one
  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleMessages((prev) => {
        if (prev >= messages.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const messages = [
    {
      type: "bot" as const,
      text: "Olá! 👋\nBem-vindo ao *Sabor da Casa*!\nSou o assistente virtual e estou aqui para te ajudar.",
      time: "19:01",
    },
    {
      type: "bot" as const,
      text: "O que você gostaria de fazer?\n\n1️⃣ Ver o cardápio\n2️⃣ Fazer um pedido\n3️⃣ Acompanhar meu pedido\n4️⃣ Falar com atendente",
      time: "19:01",
    },
    {
      type: "user" as const,
      text: "2",
      time: "19:02",
    },
    {
      type: "bot" as const,
      text: "Ótimo! 🍔 Vamos montar seu pedido!\n\nEscolha a categoria:\n\n🍔 Hambúrgueres\n🍕 Pizzas\n🥗 Saladas\n🍟 Acompanhamentos\n🥤 Bebidas",
      time: "19:02",
    },
    {
      type: "user" as const,
      text: "Hambúrgueres",
      time: "19:02",
    },
    {
      type: "bot" as const,
      text: "🍔 *Hambúrgueres*\n\n1. Big Salada — R$ 22,00\n2. Especial de Bacon — R$ 26,00\n3. Frango Crocante — R$ 24,00\n4. Veggie Burger — R$ 25,00\n\nDigite o número do item:",
      time: "19:03",
    },
    {
      type: "user" as const,
      text: "2",
      time: "19:03",
    },
    {
      type: "bot" as const,
      text: "Excelente escolha! ✅\n*Especial de Bacon* adicionado!\n\nDeseja adicionar complementos?\n\n🧀 Queijo extra — R$ 3,00\n🥓 Bacon extra — R$ 4,00\n🍟 Batata frita — R$ 8,00\n\nOu digite *0* para finalizar",
      time: "19:03",
    },
    {
      type: "user" as const,
      text: "Batata frita",
      time: "19:04",
    },
    {
      type: "bot" as const,
      text: "🛒 *Resumo do pedido:*\n\n1x Especial de Bacon — R$ 26,00\n1x Batata frita — R$ 8,00\n\n💰 *Total: R$ 34,00*\n\nForma de pagamento:\n1️⃣ Pix\n2️⃣ Cartão na entrega\n3️⃣ Dinheiro",
      time: "19:04",
    },
    {
      type: "user" as const,
      text: "1",
      time: "19:05",
    },
    {
      type: "bot" as const,
      text: "✅ *Pedido #P42 confirmado!*\n\n📍 Entrega em: Rua das Flores, 123\n⏱️ Tempo estimado: 35-45 min\n💳 Pagamento: Pix\n\nEnviaremos o QR Code do Pix em instantes! 😊",
      time: "19:05",
    },
  ];

  // Format text with bold markers
  const formatText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <span key={i} style={{ fontWeight: 600 }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      style={{
        fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        fontSize: "14px",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#e5ddd5",
        overflow: "hidden",
        lineHeight: 1.4,
      }}
    >
      {/* iOS WhatsApp Header - Light/white style */}
      <div
        style={{
          background: "#f6f6f6",
          borderBottom: "0.5px solid #d1d1d6",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "52px",
        }}
      >
        {/* Back arrow with count */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ color: "#007AFF", fontSize: "16px", fontWeight: 400 }}>9</span>
        </div>
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "white", fontWeight: 700, fontSize: "14px" }}>S</span>
        </div>
        {/* Contact info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#000", fontWeight: 600, fontSize: "15px", lineHeight: 1.2 }}>
            Sabor da Casa
          </div>
          <div style={{ color: "#8e8e93", fontSize: "12px", lineHeight: 1.2 }}>
            Toque para info do contato
          </div>
        </div>
        {/* Action icons - iOS style */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <div style={{ padding: "6px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M23 7l-7 5 7 5V7z" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="#007AFF" strokeWidth="1.5" />
            </svg>
          </div>
          <div style={{ padding: "6px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Chevron down */}
          <div style={{ padding: "2px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5L7 9L11 5" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat area - iOS WhatsApp wallpaper (beige/tan) */}
      <div
        style={{
          flex: 1,
          background: "#e5ddd5",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.25'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          overflowY: "auto",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* Date chip - iOS style */}
        <div
          style={{
            alignSelf: "center",
            background: "rgba(225,219,211,0.92)",
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "11px",
            color: "#6b7c85",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          seg., 6 de abr.
        </div>

        {/* Encryption notice - iOS style */}
        <div
          style={{
            alignSelf: "center",
            background: "rgba(255,243,191,0.92)",
            borderRadius: "8px",
            padding: "5px 10px",
            fontSize: "10.5px",
            color: "#6b7c85",
            textAlign: "center",
            maxWidth: "85%",
            marginBottom: "6px",
            lineHeight: 1.3,
          }}
        >
          🔒 As mensagens são protegidas com criptografia de ponta a ponta.
        </div>

        {/* Messages */}
        {messages.slice(0, visibleMessages).map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: msg.type === "user" ? "#dcf8c6" : "#ffffff",
              borderRadius: "7.5px",
              padding: "5px 7px 3px 8px",
              boxShadow: "0 1px 0.5px rgba(0,0,0,0.08)",
              position: "relative",
              animation: "fadeInUp 0.3s ease-out",
            }}
          >
            <div
              style={{
                whiteSpace: "pre-line",
                fontSize: "14px",
                color: "#000",
                lineHeight: 1.35,
                paddingRight: "50px",
                letterSpacing: "-0.1px",
              }}
            >
              {formatText(msg.text)}
            </div>
            <div
              style={{
                fontSize: "10.5px",
                color: "#8e8e93",
                textAlign: "right",
                marginTop: "-2px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {msg.time}
              {msg.type === "user" && (
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <path d="M11.071.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 00-.336-.153.457.457 0 00-.339.142.49.49 0 00-.14.343c0 .13.05.255.14.343l2.357 2.456a.463.463 0 00.681-.016l6.527-8.05a.487.487 0 00-.004-.682z" fill="#53bdeb" />
                  <path d="M14.757.653a.457.457 0 00-.305-.102.493.493 0 00-.38.178l-6.19 7.636-1.166-1.214-.346.427 1.166 1.214a.463.463 0 00.681-.016l6.527-8.05a.487.487 0 00.013-.073z" fill="#53bdeb" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* iOS Input bar */}
      <div
        style={{
          background: "#f6f6f6",
          borderTop: "0.5px solid #d1d1d6",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          minHeight: "44px",
        }}
      >
        {/* Plus button */}
        <div
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#8e8e93" strokeWidth="1.5" />
            <path d="M12 7v10M7 12h10" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        {/* Input field - iOS rounded style */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "18px",
            padding: "7px 14px",
            fontSize: "15px",
            color: "#8e8e93",
            border: "0.5px solid #d1d1d6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Mensagem</span>
          {/* Sticker icon inside input */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#8e8e93" strokeWidth="1.2" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8e8e93" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="9" cy="10" r="1" fill="#8e8e93" />
            <circle cx="15" cy="10" r="1" fill="#8e8e93" />
          </svg>
        </div>
        {/* Camera */}
        <div
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke="#8e8e93" strokeWidth="1.5" />
          </svg>
        </div>
        {/* Mic */}
        <div
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V23M8 23h8" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
