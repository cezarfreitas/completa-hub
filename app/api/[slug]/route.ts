/**
 * POST /api/[slug] - Viabilidade (retrocompatibilidade)
 * Rotas por cliente:
 * - POST /api/[slug]/viabilidade - Consultar viabilidade e cadastrar
 * - POST /api/[slug]/documentacao - Documentação e contrato (webhook n8n)
 */
export { POST } from "./viabilidade/route";
