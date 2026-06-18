import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { makeRequest, type GeocodingResult } from "../_core/map";
import { publicProcedure, router } from "../_core/trpc";

type AddressData = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  formattedAddress: string;
};

type GoogleAddressComponent = GeocodingResult["results"][number]["address_components"][number];

const coordinateSchema = z.number().finite();

function normalizeZipCode(zipCode?: string) {
  return (zipCode || "").replace(/\D/g, "");
}

function getComponent(
  components: GoogleAddressComponent[],
  types: string[],
  field: "long_name" | "short_name" = "long_name"
) {
  return components.find((component) => types.some((type) => component.types.includes(type)))?.[field] || "";
}

function parseGoogleResult(result: GeocodingResult["results"][number]): AddressData {
  const components = result.address_components || [];
  const location = result.geometry.location;
  const street =
    getComponent(components, ["route"]) ||
    getComponent(components, ["premise", "establishment", "point_of_interest"]) ||
    result.formatted_address ||
    "Localização selecionada";

  return {
    street,
    number: getComponent(components, ["street_number"]),
    neighborhood: getComponent(components, ["sublocality_level_1", "sublocality", "neighborhood", "political"]),
    city: getComponent(components, ["administrative_area_level_2", "locality"]),
    state: getComponent(components, ["administrative_area_level_1"], "short_name"),
    zipCode: normalizeZipCode(getComponent(components, ["postal_code"])),
    latitude: String(location.lat),
    longitude: String(location.lng),
    formattedAddress: result.formatted_address || "",
  };
}

function firstValidAddress(result: GeocodingResult): AddressData | null {
  const first = result.results?.[0];
  if (!first?.geometry?.location) return null;
  return parseGoogleResult(first);
}

function asPublicMapError(error: unknown, fallbackMessage: string) {
  if (error instanceof TRPCError) return error;
  console.error("[Maps Router] Google Maps proxy request failed:", error instanceof Error ? error.message : String(error));
  return new TRPCError({
    code: "BAD_GATEWAY",
    message: fallbackMessage,
  });
}

export const mapsRouter = router({
  geocode: publicProcedure
    .input(z.object({ address: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input }) => {
      try {
        const query = /brasil/i.test(input.address) ? input.address : `${input.address}, Brasil`;
        const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
          address: query,
          region: "br",
          language: "pt-BR",
        });

        if (result.status !== "OK") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.status === "ZERO_RESULTS"
              ? "Endereço não encontrado. Tente incluir cidade, estado ou CEP."
              : "Não foi possível buscar este endereço agora.",
          });
        }

        const address = firstValidAddress(result);
        if (!address) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Endereço encontrado, mas sem coordenadas válidas.",
          });
        }

        return address;
      } catch (error) {
        throw asPublicMapError(error, "Serviço de busca de endereço indisponível no momento.");
      }
    }),

  reverseGeocode: publicProcedure
    .input(z.object({
      lat: coordinateSchema.min(-90).max(90),
      lng: coordinateSchema.min(-180).max(180),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
          latlng: `${input.lat},${input.lng}`,
          region: "br",
          language: "pt-BR",
        });

        if (result.status !== "OK") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.status === "ZERO_RESULTS"
              ? "Não encontramos um endereço para esta coordenada."
              : "Não foi possível converter a coordenada em endereço agora.",
          });
        }

        const address = firstValidAddress(result);
        if (!address) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Coordenada encontrada, mas sem endereço válido.",
          });
        }

        return address;
      } catch (error) {
        throw asPublicMapError(error, "Serviço de localização indisponível no momento.");
      }
    }),
});
