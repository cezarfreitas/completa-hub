import { POST as verificacaoHandler } from "../verificacao/route";

/**
 * POST /api/[slug]/viabilidade - Consultar viabilidade e cadastrar (pre-subscription)
 * Substitui o webhook n8n: Geocode → API Completa → retorna Cobertura, id_conecteai
 * Campos: rua, numero, bairro, cidade, cep, nome, whatsapp
 */
export { verificacaoHandler as POST };
