/**
 * Helper function to build WhatsApp delivery notification message for drivers.
 * Follows the user-defined format with emojis, structured address, and troco info.
 */
import { getIfoodDeliveryConfirmationInfo } from './ifoodDeliveryConfirmation';

export function buildDriverDeliveryMessage(order: {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentMethod: string;
  total: string;
  deliveryFee: string;
  notes: string | null;
  changeAmount: string | null;
  source?: string | null;
  deliveryType?: string | null;
  orderType?: string | null;
  externalDisplayId?: string | null;
  externalData?: any;
}, deliveryFeeOverride?: number): string {
  const address = order.customerAddress || '';
  const fee = deliveryFeeOverride !== undefined ? deliveryFeeOverride : parseFloat(order.deliveryFee || '0');
  
  // Parse address parts: "Rua X, 123 - Apto 1, Bairro Y (Ref: ponto ref)"
  // Format: street, number[ - complement], neighborhood[ (Ref: reference)]
  let addressBlock = '';
  if (address) {
    // Split by comma to get parts
    const parts = address.split(',').map(p => p.trim());
    // First part: street
    const street = parts[0] || '';
    // Second part: number (may include complement after " - ")
    const numberPart = parts[1] || '';
    // Third part: neighborhood (may include reference in parentheses)
    const neighborhoodPart = parts.slice(2).join(',').trim();
    
    // Extract reference from neighborhood part if present
    const refMatch = neighborhoodPart.match(/^(.+?)\s*\(Ref:\s*(.+?)\)$/);
    const neighborhood = refMatch ? refMatch[1].trim() : neighborhoodPart;
    const reference = refMatch ? refMatch[2].trim() : '';
    
    addressBlock = `\n📍 *Endereço:*\n${street}, ${numberPart}\n${neighborhood}`;
    if (reference) {
      addressBlock += `\nRef: ${reference}`;
    }
  } else {
    addressBlock = `\n📍 *Endereço:* N/A`;
  }
  
  // Payment method label
  const paymentLabel = order.paymentMethod === 'cash' ? 'Dinheiro' 
    : order.paymentMethod === 'card' ? 'Cartão' 
    : order.paymentMethod === 'card_online' ? 'Cartão Online'
    : order.paymentMethod === 'pix_online' ? 'Pix Online'
    : order.paymentMethod === 'pix' ? 'Pix' 
    : order.paymentMethod === 'boleto' ? 'Boleto'
    : order.paymentMethod;
  
  // Build change/troco info for cash payments
  let trocoBlock = '';
  if (order.paymentMethod === 'cash') {
    const changeAmount = parseFloat(order.changeAmount || '0');
    if (changeAmount > 0) {
      const trocoFormatted = `R$ ${changeAmount.toFixed(2).replace('.', ',')}`;
      trocoBlock = `\n💵 *Troco para:* ${trocoFormatted}`;
    } else {
      trocoBlock = `\n💵 *Troco:* Não precisa`;
    }
  }
  
  const ifoodConfirmation = getIfoodDeliveryConfirmationInfo(order);
  const ifoodBlock = ifoodConfirmation
    ? `\n\n🍽️ *Confirmação iFood*` +
      `\nLocalizador do pedido: ${ifoodConfirmation.localizer || 'não informado pelo iFood'}` +
      (ifoodConfirmation.displayId ? `\nCódigo/Pedido iFood: ${ifoodConfirmation.displayId}` : '') +
      `\nLink para confirmar no final da entrega: ${ifoodConfirmation.url}` +
      `\nPeça ao cliente o código de confirmação e informe junto com o localizador no link acima.`
    : '';
  
  const message = `🛵 *NOVA ENTREGA!*\n\n` +
    `📦 Pedido: ${order.orderNumber}\n` +
    `👤 Cliente: ${order.customerName || 'N/A'}\n` +
    `📞 Telefone: ${order.customerPhone || 'N/A'}\n` +
    addressBlock + `\n\n` +
    `💳 Pagamento: ${paymentLabel}\n` +
    `💰 Total: R$ ${parseFloat(order.total || '0').toFixed(2).replace('.', ',')}\n` +
    `🛵 Taxa de entrega: R$ ${fee.toFixed(2).replace('.', ',')}` +
    trocoBlock +
    ifoodBlock +
    (order.notes ? `\n\n*Observações:* ${order.notes}` : '');
  
  return message;
}

/**
 * Build a Google Maps navigation/directions URL.
 * 
 * Priority:
 * 1. If lat/lng are provided, use them for precise navigation (directions mode)
 * 2. Otherwise, fall back to address text search
 * 
 * The URL uses Google Maps directions mode (/maps/dir/) so the driver
 * can navigate directly from their current location to the delivery address.
 */
export function buildGoogleMapsUrl(
  customerAddress: string | null,
  customerLat?: string | null,
  customerLng?: string | null,
): string | null {
  // If we have coordinates, use directions mode for precise navigation
  if (customerLat && customerLng) {
    const lat = parseFloat(customerLat);
    const lng = parseFloat(customerLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      // Google Maps directions URL: navigates FROM current location TO destination
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
  }
  
  // Fallback: use address text for search
  if (!customerAddress || customerAddress.trim() === '' || customerAddress === 'N/A') {
    return null;
  }
  
  // Remove reference part (Ref: ...) as it's not a real address component
  let cleanAddress = customerAddress.replace(/\s*\(Ref:\s*.+?\)\s*/gi, '').trim();
  
  // Remove trailing commas
  cleanAddress = cleanAddress.replace(/,\s*$/, '').trim();
  
  if (!cleanAddress) return null;
  
  const encoded = encodeURIComponent(cleanAddress);
  // Use directions mode even with address text for navigation experience
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
}
