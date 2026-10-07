import mongoose, { Schema } from 'mongoose';

const AgentActionLogSchema = new Schema({
  sessionId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toolName: { type: String, required: true },
  input: { type: Schema.Types.Mixed, required: true },
  output: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  confirmedByUser: { type: Boolean, default: false },
});

AgentActionLogSchema.index({ sessionId: 1, timestamp: -1 });

const AgentActionLog =
  mongoose.models.AgentActionLog ||
  mongoose.model('AgentActionLog', AgentActionLogSchema);
export default AgentActionLog;
