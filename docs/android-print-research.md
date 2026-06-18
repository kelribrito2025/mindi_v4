# Pesquisa: App Android para Impressão ESC/POS

## Biblioteca Recomendada
**DantSu/ESCPOS-ThermalPrinter-Android**
- GitHub: https://github.com/DantSu/ESCPOS-ThermalPrinter-Android
- Suporta: Bluetooth, TCP/WiFi, USB
- SDK mínimo: Android 4.1 (API 16)

## Conexão TCP/WiFi (nossa necessidade)
```java
new Thread(new Runnable() {
    public void run() {
        try {
            EscPosPrinter printer = new EscPosPrinter(
                new TcpConnection("192.168.1.3", 9100, 15), // IP, porta, timeout
                203,  // DPI
                48f,  // largura em mm
                32    // caracteres por linha
            );
            printer.printFormattedText("...");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}).start();
```

## Permissões necessárias (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

## Arquitetura Proposta

### Fluxo:
1. Novo pedido chega no sistema web
2. Sistema adiciona pedido à fila de impressão (banco de dados)
3. App Android faz polling periódico para buscar pedidos pendentes
4. App Android recebe dados do pedido e envia para impressora via TCP
5. App marca pedido como impresso

### Endpoints necessários no servidor:
1. `GET /api/print-queue` - Buscar pedidos pendentes de impressão
2. `POST /api/print-queue/:id/complete` - Marcar como impresso
3. `POST /api/print-queue/:id/error` - Reportar erro de impressão

### Tabela no banco:
```sql
CREATE TABLE print_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  establishment_id INT NOT NULL,
  order_id INT NOT NULL,
  printer_id INT,
  status ENUM('pending', 'printing', 'completed', 'error') DEFAULT 'pending',
  print_data JSON, -- Dados formatados para impressão
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  printed_at TIMESTAMP
);
```

## Alternativa: App Existente
- **ESC POS Wifi Print Service** (Google Play)
- Permite imprimir de qualquer app via Intent
- Pode ser usado como solução temporária

## Decisão
Criar endpoints de API para fila de impressão que podem ser consumidos por:
1. App Android nativo (futuro)
2. Apps existentes de impressão
3. Aplicativo web PWA com polling
