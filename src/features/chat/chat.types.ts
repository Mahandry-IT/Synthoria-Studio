import type { z } from "zod";
import type {
  chatHistoryResponseSchema,
  chatMessageSchema,
  chatQuotaSchema,
  chatSendResponseSchema,
  chatSourceSchema,
} from "./chat.schema";

export type ChatSource = z.infer<typeof chatSourceSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatQuota = z.infer<typeof chatQuotaSchema>;
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
export type ChatSendResponse = z.infer<typeof chatSendResponseSchema>;
