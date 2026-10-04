import { describe, expect, it } from "vitest";
import {
  appendExchange,
  dayLabel,
  groupMessagesByDay,
  isQuotaExhausted,
  localDayKey,
  remainingLabel,
  toSafeHttpUrl,
} from "./chat.logic";
import { chatHistoryResponseSchema, chatRequestSchema, chatSendResponseSchema } from "./chat.schema";
import type { ChatMessage, ChatQuota } from "./chat.types";

/** Date ISO construite en heure locale : les tests ne dépendent pas du fuseau de la machine. */
function localIso(year: number, month: number, day: number, hour: number): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

function message(id: string, created_at: string, role: ChatMessage["role"] = "user"): ChatMessage {
  return { id, role, content: id, status: "answered", sources: [], created_at };
}

const quota: ChatQuota = { limit: 15, used: 2, remaining: 13, resets_at: "2026-10-05T00:00:00Z" };

describe("chat.schema", () => {
  it("chatRequestSchema borne le message (1 à 1000 caractères, trim)", () => {
    expect(chatRequestSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ message: "x".repeat(1000) }).success).toBe(true);
    expect(chatRequestSchema.parse({ message: " Pourquoi ? " }).message).toBe("Pourquoi ?");
  });

  it("chatHistoryResponseSchema valide messages et quota, sources par défaut vides", () => {
    const parsed = chatHistoryResponseSchema.parse({
      messages: [{ id: "1", role: "assistant", content: "ok", status: "off_topic", created_at: "2026-10-04T10:00:00Z" }],
      quota,
    });
    expect(parsed.messages[0].sources).toEqual([]);
    expect(parsed.quota.remaining).toBe(13);
  });

  it("rejette un rôle ou un statut inconnu", () => {
    const base = { id: "1", content: "x", created_at: "2026-10-04T10:00:00Z", sources: [] };
    const send = (m: object) =>
      chatSendResponseSchema.safeParse({ user_message: m, assistant_message: m, quota }).success;
    expect(send({ ...base, role: "user", status: "answered" })).toBe(true);
    expect(send({ ...base, role: "system", status: "answered" })).toBe(false);
    expect(send({ ...base, role: "user", status: "blocked" })).toBe(false);
  });
});

describe("chat.logic", () => {
  it("groupe par jour : jours décroissants, messages chronologiques dans le jour", () => {
    const groups = groupMessagesByDay([
      message("b", localIso(2026, 10, 3, 15)),
      message("c", localIso(2026, 10, 4, 9)),
      message("a", localIso(2026, 10, 3, 8)),
      message("d", localIso(2026, 10, 4, 18)),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["2026-10-04", "2026-10-03"]);
    expect(groups[0].messages.map((m) => m.id)).toEqual(["c", "d"]);
    expect(groups[1].messages.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("groupe vide pour un historique vide", () => {
    expect(groupMessagesByDay([])).toEqual([]);
  });

  it("dayLabel : Aujourd'hui, Hier, sinon date longue", () => {
    const now = new Date(2026, 9, 4, 12);
    expect(dayLabel("2026-10-04", now)).toBe("Aujourd'hui");
    expect(dayLabel("2026-10-03", now)).toBe("Hier");
    expect(dayLabel("2026-09-28", now)).toContain("septembre");
    expect(localDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("quota : épuisé à 0 restant, libellé accordé", () => {
    expect(isQuotaExhausted(quota)).toBe(false);
    expect(isQuotaExhausted({ ...quota, used: 15, remaining: 0 })).toBe(true);
    expect(isQuotaExhausted(null)).toBe(false);
    expect(remainingLabel(13)).toBe("13 messages restants aujourd'hui");
    expect(remainingLabel(1)).toBe("1 message restant aujourd'hui");
    expect(remainingLabel(-2)).toBe("0 message restant aujourd'hui");
  });

  it("appendExchange ajoute l'échange sans doublon et remplace le quota", () => {
    const existing = message("u1", localIso(2026, 10, 4, 9));
    const exchange = {
      user_message: message("u2", localIso(2026, 10, 4, 10)),
      assistant_message: message("a2", localIso(2026, 10, 4, 10), "assistant"),
      quota: { ...quota, used: 3, remaining: 12 },
    };
    const next = appendExchange({ messages: [existing], quota }, exchange);
    expect(next.messages.map((m) => m.id)).toEqual(["u1", "u2", "a2"]);
    expect(next.quota.remaining).toBe(12);
    expect(appendExchange(next, exchange).messages).toHaveLength(3);
    expect(appendExchange(undefined, exchange).messages).toHaveLength(2);
  });

  it("toSafeHttpUrl n'accepte que http(s)", () => {
    expect(toSafeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(toSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeHttpUrl("Section 2 — Introduction")).toBeNull();
  });
});
