import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationLog extends Document {
  integrationSlug: string;
  request: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
    nome: string;
    whatsapp: string;
  };
  response: {
    Cobertura?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
    id_conecteai?: string | null;
    error?: string;
  };
  createdAt: Date;
}

const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    integrationSlug: { type: String, required: true, index: true },
    request: {
      rua: String,
      numero: String,
      bairro: String,
      cidade: String,
      cep: String,
      nome: String,
      whatsapp: String,
    },
    response: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const VerificationLog: Model<IVerificationLog> =
  mongoose.models.VerificationLog ||
  mongoose.model<IVerificationLog>("VerificationLog", VerificationLogSchema);
