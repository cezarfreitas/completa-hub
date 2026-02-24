import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIntegration extends Document {
  slug: string;
  name: string;
  plan_id: number;
  completa_api_url: string;
  completa_origin: string;
  n8n_webhook_url?: string;
  n8n_config_url?: string;
  /** URL base da API Completa para documentação (ex: https://acessanet.conecte.ai/api/v2) */
  documentacao_api_url?: string;
  /** Origin para chamadas da API Completa no fluxo documentação */
  documentacao_origin?: string;
  /** Plan ID para Gera Contrato no n8n (pode ser diferente do plan_id da viabilidade) */
  documentacao_plan_id?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    plan_id: { type: Number, required: true },
    completa_api_url: { type: String, required: true },
    completa_origin: { type: String, required: true },
    n8n_webhook_url: { type: String, required: false },
    n8n_config_url: { type: String, required: false },
    documentacao_api_url: { type: String, required: false },
    documentacao_origin: { type: String, required: false },
    documentacao_plan_id: { type: Number, required: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Integration: Model<IIntegration> =
  mongoose.models.Integration ||
  mongoose.model<IIntegration>("Integration", IntegrationSchema);
