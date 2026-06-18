import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, X, Check, Loader2, Navigation, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadGoogleMapsScript } from "@/lib/googleMaps";
import { trpc } from "@/lib/trpc";

interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

interface InitialAddressData {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | string;
  longitude?: number | string;
}

interface AddressMapPickerProps {
  initialAddress?: InitialAddressData;
  onAddressSelect: (address: AddressData) => void;
  onClose: () => void;
  /** If true, automatically trigger GPS on open */
  autoGps?: boolean;
  /** Optional title override */
  title?: string;
  /** Optional subtitle override */
  subtitle?: string;
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  district?: string;
  borough?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
};

const BRAZIL_CENTER = { lat: -14.235, lng: -51.9253 };

const normalizeZipCode = (zipCode?: string) => (zipCode || "").replace(/\D/g, "");

const buildFallbackAddress = (lat: number, lng: number, displayName?: string): AddressData => ({
  street: displayName || "Localização selecionada",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  latitude: lat.toString(),
  longitude: lng.toString(),
});

const parseNominatimAddress = (result: NominatimResult, lat: number, lng: number): AddressData => {
  const details = result.address || {};
  const street =
    details.road ||
    details.pedestrian ||
    details.footway ||
    details.path ||
    details.residential ||
    result.display_name ||
    "Localização selecionada";

  return {
    street,
    number: details.house_number || "",
    neighborhood:
      details.neighbourhood ||
      details.suburb ||
      details.city_district ||
      details.district ||
      details.borough ||
      "",
    city: details.city || details.town || details.village || details.municipality || details.county || "",
    state: details.state || "",
    zipCode: normalizeZipCode(details.postcode),
    latitude: lat.toString(),
    longitude: lng.toString(),
  };
};

async function reverseGeocodeWithNominatim(lat: number, lng: number): Promise<AddressData> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocoding failed: ${response.status}`);
  }

  const result = (await response.json()) as NominatimResult;
  return parseNominatimAddress(result, lat, lng);
}

async function geocodeAddressWithNominatim(query: string): Promise<AddressData | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", `${query}, Brasil`);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("accept-language", "pt-BR");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`);
  }

  const results = (await response.json()) as NominatimResult[];
  const firstResult = results[0];
  if (!firstResult?.lat || !firstResult?.lon) return null;

  return parseNominatimAddress(firstResult, Number(firstResult.lat), Number(firstResult.lon));
}

export function AddressMapPicker({
  initialAddress,
  onAddressSelect,
  onClose,
  autoGps = false,
  title = "Selecionar Localização",
  subtitle = "Clique no mapa ou busque um endereço",
}: AddressMapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const geocodeAddressViaProxy = trpc.maps.geocode.useMutation();
  const reverseGeocodeViaProxy = trpc.maps.reverseGeocode.useMutation();

  // Parse address components from geocoder result
  const parseAddressComponents = useCallback(
    (components: google.maps.GeocoderAddressComponent[], lat: number, lng: number) => {
      const address: AddressData = {
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        latitude: lat.toString(),
        longitude: lng.toString(),
      };

      for (const component of components) {
        const types = component.types;
        if (types.includes("street_number")) {
          address.number = component.long_name;
        } else if (types.includes("route")) {
          address.street = component.long_name;
        } else if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
          address.neighborhood = component.long_name;
        } else if (types.includes("administrative_area_level_2") || types.includes("locality")) {
          address.city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          address.state = component.short_name;
        } else if (types.includes("postal_code")) {
          address.zipCode = component.long_name.replace("-", "");
        }
      }

      if (!address.street) address.street = "Localização selecionada";
      setSelectedAddress(address);
    },
    []
  );

  // Reverse geocode coordinates to address. The backend proxy is preferred so the
  // modal works even when the Maps JavaScript SDK is not available in the browser.
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsSearching(true);

      try {
        try {
          const proxyAddress = await reverseGeocodeViaProxy.mutateAsync({ lat, lng });
          setSelectedAddress(proxyAddress);
          return;
        } catch (proxyError) {
          console.warn("Backend Maps reverse geocoding failed, trying browser fallbacks:", proxyError);
        }

        if (window.google?.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results) resolve(results);
              else reject(status);
            });
          });
          if (result[0]) {
            parseAddressComponents(result[0].address_components, lat, lng);
            return;
          }
        }

        const fallbackAddress = await reverseGeocodeWithNominatim(lat, lng);
        setSelectedAddress(fallbackAddress);
      } catch (e) {
        console.warn("Reverse geocoding failed, keeping coordinates only:", e);
        setSelectedAddress(buildFallbackAddress(lat, lng));
      } finally {
        setIsSearching(false);
      }
    },
    [parseAddressComponents, reverseGeocodeViaProxy]
  );

  // Move map and marker to a position
  const moveToPosition = useCallback(
    (lat: number, lng: number) => {
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(17);
      }
      if (markerRef.current) {
        markerRef.current.position = { lat, lng };
      }
    },
    []
  );

  // Helper to get position with specific options
  const getPosition = useCallback((options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("GPS_TIMEOUT"));
      }, (options.timeout || 20000) + 5000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
        options
      );
    });
  }, []);

  // Handle location using only the browser/device geolocation permission.
  const handleUseGps = useCallback(async () => {
    setIsLoadingGps(true);
    setGpsError(null);
    setGpsNotice(null);

    if (!navigator.geolocation) {
      setGpsError("Seu navegador não suporta geolocalização. Busque o endereço manualmente no campo acima.");
      setIsLoadingGps(false);
      return;
    }

    try {
      let position: GeolocationPosition;
      try {
        // First try: prefer the cached/network location because it is faster and
        // works better on desktops where precise GPS is often unavailable.
        position = await getPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
      } catch (lowAccErr: any) {
        // Second try: request high accuracy only if the quick network/wifi lookup fails.
        if (lowAccErr?.code === 2 || lowAccErr?.code === 3 || lowAccErr?.message === "GPS_TIMEOUT") {
          console.log("[GPS] Low accuracy failed, trying high accuracy fallback...");
          position = await getPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 120000 });
        } else {
          throw lowAccErr;
        }
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      moveToPosition(lat, lng);
      await reverseGeocode(lat, lng);
    } catch (error: any) {
      let msg = "Não foi possível obter sua localização. Busque o endereço manualmente no campo acima.";
      if (error?.message === "GPS_TIMEOUT") {
        msg = "Tempo esgotado ao buscar localização. Busque o endereço manualmente no campo acima.";
      } else if (error?.code === 1) {
        msg = "Permissão de localização negada. Ative a permissão nas configurações do navegador ou busque o endereço manualmente.";
      } else if (error?.code === 2) {
        msg = "Localização do dispositivo indisponível neste momento. Busque o endereço manualmente no campo acima.";
      } else if (error?.code === 3) {
        msg = "Tempo esgotado ao buscar localização. Busque o endereço manualmente no campo acima.";
      }
      setGpsError(msg);
    } finally {
      setIsLoadingGps(false);
    }
  }, [reverseGeocode, moveToPosition, getPosition]);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
      } catch (e) {
        console.error("Failed to load Google Maps:", e);
        setMapError("Mapa indisponível no momento. Use Minha localização ou busque o endereço para preencher a localização.");
        setIsLoading(false);

        if (initialAddress?.latitude && initialAddress?.longitude) {
          setSelectedAddress({
            street: initialAddress.street || "Localização selecionada",
            number: initialAddress.number || "",
            neighborhood: initialAddress.neighborhood || "",
            city: initialAddress.city || "",
            state: initialAddress.state || "",
            zipCode: String(initialAddress.zipCode || ""),
            latitude: String(initialAddress.latitude),
            longitude: String(initialAddress.longitude),
          });
        }

        if (autoGps && !initialAddress?.latitude) {
          setTimeout(() => {
            handleUseGps();
          }, 300);
        }
        return;
      }

      if (!mapContainer.current || !window.google) {
        setMapError("Mapa indisponível no momento. Use Minha localização ou busque o endereço para preencher a localização.");
        setIsLoading(false);
        return;
      }

      // Initial center - Brazil or provided address
      let initialCenter = BRAZIL_CENTER;
      let initialZoom = 4;

      if (initialAddress?.latitude && initialAddress?.longitude) {
        initialCenter = {
          lat: Number(initialAddress.latitude),
          lng: Number(initialAddress.longitude),
        };
        initialZoom = 17;
      } else if (initialAddress?.city) {
        const geocoder = new google.maps.Geocoder();
        const addressString = [
          initialAddress.street,
          initialAddress.number,
          initialAddress.neighborhood,
          initialAddress.city,
          initialAddress.state,
        ].filter(Boolean).join(", ");

        if (addressString) {
          try {
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: addressString }, (results, status) => {
                if (status === "OK" && results) resolve(results);
                else reject(status);
              });
            });
            if (result[0]) {
              initialCenter = {
                lat: result[0].geometry.location.lat(),
                lng: result[0].geometry.location.lng(),
              };
              initialZoom = 17;
            }
          } catch {
            console.log("Geocoding failed, using default center");
          }
        }
      }

      // Create map
      mapRef.current = new google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        streetViewControl: false,
        mapId: "ADDRESS_PICKER_MAP",
        gestureHandling: "greedy",
      });

      // Create draggable marker
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: initialCenter,
        gmpDraggable: true,
        title: "Arraste para ajustar a localização",
      });

      // Drag end event
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current?.position;
        if (position) {
          const lat = typeof position.lat === "function" ? position.lat() : position.lat;
          const lng = typeof position.lng === "function" ? position.lng() : position.lng;
          reverseGeocode(lat as number, lng as number);
        }
      });

      // Map click event
      mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (markerRef.current) markerRef.current.position = { lat, lng };
          reverseGeocode(lat, lng);
        }
      });

      // Setup autocomplete
      if (searchInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: "br" },
          fields: ["address_components", "geometry", "formatted_address"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            moveToPosition(lat, lng);
            parseAddressComponents(place.address_components || [], lat, lng);
          }
        });
      }

      // If already has coordinates, reverse geocode
      if (initialAddress?.latitude && initialAddress?.longitude) {
        reverseGeocode(Number(initialAddress.latitude), Number(initialAddress.longitude));
      }

      setMapError(null);
      setIsLoading(false);

      // Auto-trigger GPS if requested
      if (autoGps && !initialAddress?.latitude) {
        // Small delay to let the map render first
        setTimeout(() => {
          handleUseGps();
        }, 500);
      }
    };

    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGpsError(null);
    setGpsNotice(null);

    try {
      try {
        const proxyAddress = await geocodeAddressViaProxy.mutateAsync({ address: searchQuery.trim() });
        moveToPosition(Number(proxyAddress.latitude), Number(proxyAddress.longitude));
        setSelectedAddress(proxyAddress);
        return;
      } catch (proxyError: any) {
        console.warn("Backend Maps geocoding failed, trying browser fallbacks:", proxyError);
      }

      if (window.google?.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: searchQuery + ", Brasil" }, (results, status) => {
            if (status === "OK" && results) resolve(results);
            else reject(status);
          });
        });

        if (result[0]) {
          const lat = result[0].geometry.location.lat();
          const lng = result[0].geometry.location.lng();
          moveToPosition(lat, lng);
          parseAddressComponents(result[0].address_components, lat, lng);
          return;
        }
      }

      const fallbackAddress = await geocodeAddressWithNominatim(searchQuery);
      if (fallbackAddress) {
        moveToPosition(Number(fallbackAddress.latitude), Number(fallbackAddress.longitude));
        setSelectedAddress(fallbackAddress);
      } else {
        setGpsError("Endereço não encontrado. Tente incluir cidade, estado ou CEP.");
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
      setGpsError("Não foi possível buscar o endereço agora. Tente novamente em instantes.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center md:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal - same pattern as checkout */}
      <div className="relative w-full md:w-[480px] md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        {/* Header - red gradient matching checkout */}
        <div className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-500 px-5 py-4 rounded-t-2xl md:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-sm text-white/80">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar + GPS Button */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-500 hover:bg-red-500 text-white"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
            <Button
              variant="outline"
              onClick={handleUseGps}
              disabled={isLoadingGps}
              className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 bg-white"
              title="Usar minha localização"
            >
              {isLoadingGps ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isLoadingGps ? "Localizando..." : "Minha localização"}
              </span>
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
            <Navigation className="h-3 w-3 inline mr-0.5 text-blue-500" />
            Ao clicar em "Minha localização", tentaremos usar apenas a localização autorizada pelo dispositivo e, em seguida, preencher o endereço com o Google Maps. Se a localização não estiver disponível, busque o endereço manualmente.
          </p>
          {gpsError && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mt-2">{gpsError}</p>
          )}
          {gpsNotice && (
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-2">{gpsNotice}</p>
          )}
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[250px] max-h-[45vh]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          )}
          {mapError && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center z-10">
              <div className="rounded-full bg-red-50 p-3">
                <MapPinned className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Mapa indisponível temporariamente</p>
                <p className="text-xs text-gray-500 mt-1">{mapError}</p>
              </div>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full min-h-[250px]" />

          {/* Crosshair indicator */}
          {!mapError && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="w-8 h-8 border-2 border-red-500 rounded-full opacity-30" />
            </div>
          )}
        </div>

        {/* Selected Address Preview */}
        {selectedAddress && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50/80">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {selectedAddress.street}
                  {selectedAddress.number && `, ${selectedAddress.number}`}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedAddress.neighborhood && `${selectedAddress.neighborhood}, `}
                  {selectedAddress.city}
                  {selectedAddress.state && ` - ${selectedAddress.state}`}
                  {selectedAddress.zipCode && ` • CEP: ${selectedAddress.zipCode}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - matching checkout style */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white rounded-b-none md:rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => selectedAddress && onAddressSelect(selectedAddress)}
            disabled={!selectedAddress}
            className="flex-1 py-3 bg-red-500 hover:bg-red-500 text-white rounded-xl gap-2"
          >
            <Check className="h-4 w-4" />
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}
