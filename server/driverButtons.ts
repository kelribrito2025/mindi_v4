import { buildGoogleMapsUrl } from './driverMessage';

/**
 * Build the standard set of buttons for driver WhatsApp notifications (NOVA ENTREGA).
 * Only includes "Abrir rota" and "Sair para entrega".
 * The "O pedido foi entregue" button is sent separately in the "Entrega iniciada" message.
 * 
 * UAZAPI /send/menu supports URL buttons with format "text|https://url"
 * The Maps button opens Google Maps in navigation/directions mode.
 */
export function buildDriverButtons(
  orderNumber: string,
  customerAddress: string | null,
  customerLat?: string | null,
  customerLng?: string | null,
  options: { includeDepartureButton?: boolean } = {},
): Array<{ text: string; id: string }> {
  const buttons: Array<{ text: string; id: string }> = [];
  
  // Add Google Maps navigation button if address or coordinates are available
  const mapsUrl = buildGoogleMapsUrl(customerAddress, customerLat, customerLng);
  if (mapsUrl) {
    buttons.push({ text: '📍 Abrir rota', id: mapsUrl });
  }
  
  // Only "Sair para entrega" button — "O pedido foi entregue" comes later
  if (options.includeDepartureButton !== false) {
    buttons.push({ text: '🛵 Sair para entrega', id: `delivery_start_${orderNumber}` });
  }
  
  return buttons;
}

/**
 * Build the button for the "Entrega iniciada" confirmation message.
 * This is sent AFTER the driver clicks "Sair para entrega".
 * Contains only the "O pedido foi entregue" button.
 */
export function buildDeliveryStartedButtons(
  orderNumber: string,
  options: { ifoodConfirmationUrl?: string | null } = {},
): Array<{ text: string; id: string }> {
  return [
    {
      text: '✅ O pedido foi entregue',
      id: options.ifoodConfirmationUrl || `delivery_done_${orderNumber}`,
    },
  ];
}

