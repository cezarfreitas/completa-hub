import type { IntegrationConfig } from "./integrations";

export interface WebhookBody {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  nome: string;
  whatsapp: string;
}

interface GeocodeResult {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry: {
      location: { lat: number; lng: number };
    };
  }>;
}

interface CompletaSubscriptionResponse {
  data?: {
    id: string;
    attributes?: {
      coverage?: boolean;
    };
  };
}

export interface FlowResult {
  Cobertura: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number;
  longitude: number;
  id_conecteai: string | null;
}

export interface FlowError {
  error: string;
  details?: string;
}

export async function runVerificationFlow(
  body: WebhookBody,
  config: IntegrationConfig
): Promise<FlowResult | FlowError> {
  const { rua, numero, bairro, cidade, cep, nome, whatsapp } = body;

  const apiKey = process.env.GOOGLE_GEOCODE_API_KEY;
  if (!apiKey) {
    return {
      error:
        "Chave Google Geocode não configurada. Configure GOOGLE_GEOCODE_API_KEY no .env.local",
    };
  }

  // 1. Google Geocode
  const addressQuery = `Rua ${rua},${numero} - ${bairro}, ${cidade}, ${cep}`;
  const geocodeUrl = new URL(
    "https://maps.googleapis.com/maps/api/geocode/json"
  );
  geocodeUrl.searchParams.set("address", addressQuery);
  geocodeUrl.searchParams.set("key", apiKey);
  geocodeUrl.searchParams.set("language", "pt-BR");

  const geocodeRes = await fetch(geocodeUrl.toString());
  const geocodeData: GeocodeResult = await geocodeRes.json();

  if (!geocodeData.results?.[0]) {
    return { error: "Endereço não encontrado no Google Geocode" };
  }

  const result = geocodeData.results[0];
  const components = result.address_components;

  const getByType = (types: string[], prefer: "long" | "short" = "long") => {
    const comp = components.find((c) =>
      types.some((t) => c.types.includes(t))
    );
    return comp ? (prefer === "long" ? comp.long_name : comp.short_name) : "";
  };

  // 2. Edit Fields1
  const editFields1 = {
    Rua: getByType(["route"]) || rua,
    numero: getByType(["street_number"]) || numero,
    Bairro:
      getByType(["sublocality", "sublocality_level_1", "neighborhood"]) ||
      bairro,
    cep: getByType(["postal_code"]) || cep,
    Cidade: getByType(["administrative_area_level_2"]) || cidade,
    Estado: getByType(["administrative_area_level_1"]),
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    Nome: nome,
    Whatsapp: whatsapp.replace(/^55/, ""),
  };

  // 3. HTTP Request para API Completa
  const subscriptionBody = {
    plan_id: config.plan_id,
    subscription: {
      pre_subscription: true,
      telefone_celular: editFields1.Whatsapp,
      nome_razao_social: editFields1.Nome,
      rua: editFields1.Rua,
      numero: editFields1.numero,
      cidade: editFields1.Cidade,
      bairro: editFields1.Bairro,
      cep: editFields1.cep,
      coordinates: {
        lat: String(editFields1.latitude),
        lng: String(editFields1.longitude),
      },
    },
  };

  const completaRes = await fetch(config.completa_api_url, {
    method: "POST",
    headers: {
      Origin: config.completa_origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscriptionBody),
  });

  const completaData: CompletaSubscriptionResponse = await completaRes.json();

  // 4. Montar resposta final
  const coverage = completaData.data?.attributes?.coverage ?? false;
  const cepFromGeocode = getByType(["postal_code"], "short") || editFields1.cep;

  return {
    Cobertura: coverage ? "Tem Cobertura" : "Sem Cobertura",
    rua: editFields1.Rua,
    numero: editFields1.numero,
    bairro: editFields1.Bairro,
    cidade: editFields1.Cidade,
    estado: editFields1.Estado,
    cep: cepFromGeocode,
    latitude: editFields1.latitude,
    longitude: editFields1.longitude,
    id_conecteai: completaData.data?.id ?? null,
  };
}
