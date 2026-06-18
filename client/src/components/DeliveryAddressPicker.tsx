import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, ChevronRight, Search, Loader2 } from "lucide-react";
import { AddressMapPicker } from "@/components/AddressMapPicker";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

export interface DeliveryAddressData {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  reference: string;
  city?: string;
  state?: string;
  lat?: string;
  lng?: string;
}

interface DeliveryAddressPickerProps {
  address: DeliveryAddressData;
  onAddressChange: (address: DeliveryAddressData) => void;
  /** When deliveryFeeType is 'byNeighborhood', render the neighborhood selector instead */
  neighborhoodSelector?: React.ReactNode;
  /** Whether the establishment uses byNeighborhood fee type */
  isByNeighborhood?: boolean;
  /** Whether the establishment uses byRadius fee type - shows autocomplete first */
  isByRadius?: boolean;
}

type Mode = "idle" | "manual" | "confirmed";

export function DeliveryAddressPicker({
  address,
  onAddressChange,
  neighborhoodSelector,
  isByNeighborhood = false,
  isByRadius = false,
}: DeliveryAddressPickerProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  // If address already has street, start in confirmed mode
  // For byRadius, start in "idle" which will show the autocomplete-first flow
  const [mode, setMode] = useState<Mode>(address.street ? "confirmed" : "idle");

  const handleMapAddressSelect = (selected: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: string;
    longitude: string;
  }) => {
    onAddressChange({
      ...address,
      street: selected.street || address.street,
      number: selected.number || address.number,
      neighborhood: isByNeighborhood
        ? address.neighborhood
        : selected.neighborhood || address.neighborhood,
      city: selected.city,
      state: selected.state,
      lat: selected.latitude,
      lng: selected.longitude,
    });
    setShowMapPicker(false);
    setMode("confirmed");
  };

  // Shared input style
  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors";

  return (
    <div className="mt-4 space-y-3">
      {/* ── IDLE: choose how to enter address ── */}
      {mode === "idle" && !isByRadius && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium flex items-center gap-2 px-1">
            <MapPin className="h-4 w-4 text-red-500" />
            Como deseja informar o endereço?
          </p>

          {/* Option: Manual address entry */}
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="w-full flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <MapPin className="h-4.5 w-4.5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-gray-800">Digitar endereço</span>
              <p className="text-xs text-gray-400">Preencha os campos manualmente</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {/* ── IDLE + BY RADIUS: show address search and GPS/map option ── */}
      {mode === "idle" && isByRadius && (
        <div className="space-y-2">
          <RadiusAddressSearch
            onAddressSelect={(selected) => {
              onAddressChange({
                ...address,
                street: selected.street,
                number: selected.number,
                neighborhood: selected.neighborhood,
                city: selected.city,
                state: selected.state,
                lat: selected.lat,
                lng: selected.lng,
              });
              setMode("confirmed");
            }}
          />

          {/* Option: Use GPS location — only available for delivery fee by Km */}
          <button
            type="button"
            onClick={() => {
              setShowMapPicker(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Navigation className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-gray-800">Usar minha localização</span>
              <p className="text-xs text-gray-400">Selecione no mapa automaticamente</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </button>
        </div>
      )}

      {/* ── MANUAL: inline address fields ── */}
      {mode === "manual" && (
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Informe o endereço
            </p>
            <button
              type="button"
              onClick={() => {
                // Reset address and go back to idle
                onAddressChange({
                  street: "",
                  number: "",
                  neighborhood: "",
                  complement: "",
                  reference: "",
                });
                setMode("idle");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Voltar
            </button>
          </div>

          <div className="px-4 pb-4 pt-2 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) =>
                    onAddressChange({ ...address, street: e.target.value })
                  }
                  placeholder="Nome da rua"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={address.number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    onAddressChange({ ...address, number: value });
                  }}
                  placeholder="Nº"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              {isByNeighborhood && neighborhoodSelector ? (
                neighborhoodSelector
              ) : (
                <input
                  type="text"
                  value={address.neighborhood}
                  onChange={(e) =>
                    onAddressChange({ ...address, neighborhood: e.target.value })
                  }
                  placeholder="Nome do bairro"
                  className={inputClass}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={address.complement}
                onChange={(e) =>
                  onAddressChange({ ...address, complement: e.target.value })
                }
                placeholder="Apto, bloco, etc."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ponto de referência
              </label>
              <input
                type="text"
                value={address.reference}
                onChange={(e) =>
                  onAddressChange({ ...address, reference: e.target.value })
                }
                placeholder="Próximo a..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMED: address preview + editable fields ── */}
      {mode === "confirmed" && (
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          {/* Address preview header */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">
                  {address.street}
                  {address.number && `, ${address.number}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {address.neighborhood && `${address.neighborhood}`}
                  {address.city && `, ${address.city}`}
                  {address.state && ` - ${address.state}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddressChange({
                    street: "",
                    number: "",
                    neighborhood: "",
                    complement: "",
                    reference: "",
                  });
                  setMode("idle");
                }}
                className="text-xs text-red-500 font-medium hover:text-red-600 transition-colors whitespace-nowrap"
              >
                Alterar
              </button>
            </div>
          </div>

          {/* Editable fields */}
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) =>
                    onAddressChange({ ...address, street: e.target.value })
                  }
                  placeholder="Nome da rua"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={address.number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    onAddressChange({ ...address, number: value });
                  }}
                  placeholder="Nº"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              {isByNeighborhood && neighborhoodSelector ? (
                neighborhoodSelector
              ) : (
                <input
                  type="text"
                  value={address.neighborhood}
                  onChange={(e) =>
                    onAddressChange({
                      ...address,
                      neighborhood: e.target.value,
                    })
                  }
                  placeholder="Nome do bairro"
                  className={inputClass}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={address.complement}
                onChange={(e) =>
                  onAddressChange({ ...address, complement: e.target.value })
                }
                placeholder="Apto, bloco, etc."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ponto de referência
              </label>
              <input
                type="text"
                value={address.reference}
                onChange={(e) =>
                  onAddressChange({ ...address, reference: e.target.value })
                }
                placeholder="Próximo a..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* AddressMapPicker Modal - same component used in Configurações */}
      {showMapPicker && (
        <AddressMapPicker
          initialAddress={{
            street: address.street || undefined,
            number: address.number || undefined,
            neighborhood: address.neighborhood || undefined,
            city: address.city || undefined,
            state: address.state || undefined,
            latitude: address.lat || undefined,
            longitude: address.lng || undefined,
          }}
          onAddressSelect={handleMapAddressSelect}
          onClose={() => setShowMapPicker(false)}
          autoGps={true}
          title="Endereço de entrega"
          subtitle="Busque ou selecione no mapa o local de entrega"
        />
      )}
    </div>
  );
}

// ── RadiusAddressSearch: Autocomplete-first address input for byRadius ──
interface RadiusAddressSearchProps {
  onAddressSelect: (address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    lat: string;
    lng: string;
  }) => void;
}

function RadiusAddressSearch({ onAddressSelect }: RadiusAddressSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const hiddenMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Actively load Google Maps if not already loaded
    const init = async () => {
      try {
        await loadGoogleMapsScript();
        // Now google.maps.places should be available
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
          if (hiddenMapRef.current) {
            const map = new google.maps.Map(hiddenMapRef.current, { center: { lat: -23.5, lng: -46.6 }, zoom: 10 });
            placesServiceRef.current = new google.maps.places.PlacesService(map);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load Google Maps for address search:", err);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    if (!value.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: "br" },
        types: ["address"],
      },
      (results) => {
        setPredictions(results || []);
      }
    );
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "geometry"],
      },
      (place) => {
        if (!place?.geometry?.location) return;
        const components = place.address_components || [];
        const getComponent = (type: string) =>
          components.find((c) => c.types.includes(type))?.long_name || "";

        const street = getComponent("route");
        const number = getComponent("street_number");
        const neighborhood =
          getComponent("sublocality_level_1") ||
          getComponent("sublocality") ||
          getComponent("neighborhood");
        const city =
          getComponent("administrative_area_level_2") ||
          getComponent("locality");
        const state = getComponent("administrative_area_level_1");
        const lat = place.geometry!.location!.lat().toString();
        const lng = place.geometry!.location!.lng().toString();

        onAddressSelect({ street, number, neighborhood, city, state, lat, lng });
        setPredictions([]);
        setSearchValue(prediction.description);
      }
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 font-medium flex items-center gap-2 px-1">
        <MapPin className="h-4 w-4 text-red-500" />
        Busque seu endereço
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={isLoading ? "Carregando..." : "Digite seu endereço..."}
          disabled={isLoading}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors placeholder:text-gray-400"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Predictions dropdown */}
      {predictions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate font-medium">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hidden map div for PlacesService */}
      <div ref={hiddenMapRef} className="hidden" />
    </div>
  );
}
