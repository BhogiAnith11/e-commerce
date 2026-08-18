import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentActionLog extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: Date;
  confirmedByUser: boolean;
}

const AgentActionLogSchema = new Schema<IAgentActionLog>({
  sessionId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toolName: { type: String, required: true },
  input: { type: Schema.Types.Mixed, required: true },
  output: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  confirmedByUser: { type: Boolean, default: false },
});

AgentActionLogSchema.index({ sessionId: 1, timestamp: -1 });

const AgentActionLog: Model<IAgentActionLog> =
  mongoose.models.AgentActionLog ||
  mongoose.model<IAgentActionLog>('AgentActionLog', AgentActionLogSchema);
export default AgentActionLog;
