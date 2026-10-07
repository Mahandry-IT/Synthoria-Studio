import { describe, expect, it } from "vitest";
import {
  appendExchange,
  dayLabel,
  groupMessagesByDay,
  isQuotaExhausted,
  lastAssistantId,
  localDayKey,
  remainingLabel,
  removeMessageBranch,
  resolveThread,
  ROOT_KEY,
  selectionAfterDelete,
  selectMessage,
  toSafeHttpUrl,
} from "./chat.logic";
import { chatHistoryResponseSchema, chatRequestSchema, chatSendResponseSchema } from "./chat.schema";
import type { ChatMessage, ChatQuota } from "./chat.types";

/** Date ISO construite en heure locale : les tests ne dépendent pas du fuseau de la machine. */
function localIso(year: number, month: number, day: number, hour: number): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

function message(
  id: string,
  created_at: string,
  role: ChatMessage["role"] = "user",
  parent_id: string | null = null,
): ChatMessage {
  return { id, role, content: id, status: "answered", sources: [], created_at, parent_id };
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

describe("chatRequestSchema — section_id", () => {
  it("accepte une section facultative et la rejette vide", () => {
    expect(chatRequestSchema.safeParse({ message: "Pourquoi ?", section_id: "s2" }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "Pourquoi ?" }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "Pourquoi ?", section_id: "" }).success).toBe(false);
  });
});

describe("chat schema — parent_id", () => {
  it("parent_id vaut null par défaut dans un message (historique antérieur aux versions)", () => {
    const parsed = chatHistoryResponseSchema.parse({
      messages: [{ id: "1", role: "user", content: "x", status: "answered", created_at: "2026-10-04T10:00:00Z" }],
      quota,
    });
    expect(parsed.messages[0].parent_id).toBeNull();
  });

  it("la requête accepte un parent (id ou null pour la racine) et rejette un id vide", () => {
    expect(chatRequestSchema.safeParse({ message: "Q", parent_id: "a1" }).success).toBe(true);
    expect(chatRequestSchema.parse({ message: "Q", parent_id: null }).parent_id).toBeNull();
    expect(chatRequestSchema.safeParse({ message: "Q", parent_id: "" }).success).toBe(false);
  });
});

describe("chat.logic — versions en arbre", () => {
  const at = (hour: number) => localIso(2026, 10, 4, hour);
  // u1 → a1 → u2 → a2 ; u2 éditée en u2b (même parent a1) ; u1 éditée en u1b (racine)
  const u1 = message("u1", at(8));
  const a1 = message("a1", at(9), "assistant", "u1");
  const u2 = message("u2", at(10), "user", "a1");
  const a2 = message("a2", at(11), "assistant", "u2");
  const u2b = message("u2b", at(12), "user", "a1");
  const a2b = message("a2b", at(13), "assistant", "u2b");
  const u1b = message("u1b", at(14));
  const a1b = message("a1b", at(15), "assistant", "u1b");
  const all = [a2b, u1, a1, u2, a2, u2b, u1b, a1b]; // ordre d'arrivée quelconque

  const ids = (selection = {}) => resolveThread(all, selection).map((e) => e.message.id);

  it("affiche par défaut la version la plus récente à chaque niveau", () => {
    const thread = resolveThread(all);
    expect(thread.map((e) => e.message.id)).toEqual(["u1b", "a1b"]);
    expect(thread[0].versions).toEqual({ parentKey: ROOT_KEY, index: 2, count: 2, previousId: "u1", nextId: null });
    expect(thread[1].versions).toBeNull();
  });

  it("suit la sélection à chaque niveau, sinon la version la plus récente", () => {
    expect(ids({ [ROOT_KEY]: "u1" })).toEqual(["u1", "a1", "u2b", "a2b"]);
    expect(ids({ [ROOT_KEY]: "u1", a1: "u2" })).toEqual(["u1", "a1", "u2", "a2"]);
    const thread = resolveThread(all, { [ROOT_KEY]: "u1", a1: "u2" });
    expect(thread[0].versions).toMatchObject({ index: 1, count: 2, previousId: null, nextId: "u1b" });
    expect(thread[2].versions).toMatchObject({ parentKey: "a1", index: 1, count: 2, nextId: "u2b" });
  });

  it("ignore une sélection obsolète (message disparu)", () => {
    expect(ids({ [ROOT_KEY]: "supprime" })).toEqual(["u1b", "a1b"]);
  });

  it("fil vide et parent d'une nouvelle question", () => {
    expect(resolveThread([])).toEqual([]);
    expect(lastAssistantId([])).toBeNull();
    expect(lastAssistantId(resolveThread(all, { [ROOT_KEY]: "u1" }))).toBe("a2b");
  });

  it("après édition, la nouvelle version devient la sélection de son niveau", () => {
    const u2c = message("u2c", at(16), "user", "a1");
    const selection = selectMessage({ [ROOT_KEY]: "u1", a1: "u2" }, u2c);
    expect(selection).toEqual({ [ROOT_KEY]: "u1", a1: "u2c" });
    const thread = resolveThread([...all, u2c], selection);
    expect(thread.map((e) => e.message.id)).toEqual(["u1", "a1", "u2c"]);
    expect(thread[2].versions).toMatchObject({ index: 3, count: 3 });
    expect(selectMessage({}, u1b)).toEqual({ [ROOT_KEY]: "u1b" });
  });

  it("après suppression d'une version, affiche la voisine et le compteur baisse", () => {
    // suppression de la version affichée la plus récente : la précédente prend sa place
    let selection = selectionAfterDelete(all, { [ROOT_KEY]: "u1", a1: "u2b" }, "u2b");
    expect(selection).toEqual({ [ROOT_KEY]: "u1", a1: "u2" });
    let remaining = removeMessageBranch({ messages: all, quota }, "u2b").messages;
    expect(resolveThread(remaining, selection)[2].versions).toMatchObject({ index: 1, count: 1 });

    // suppression de la première version : la suivante prend sa place
    selection = selectionAfterDelete(all, { [ROOT_KEY]: "u1", a1: "u2" }, "u2");
    expect(selection).toEqual({ [ROOT_KEY]: "u1", a1: "u2b" });
    remaining = removeMessageBranch({ messages: all, quota }, "u2").messages;
    expect(resolveThread(remaining, selection).map((e) => e.message.id)).toEqual(["u1", "a1", "u2b", "a2b"]);
  });

  it("sans version restante, la branche disparaît du fil", () => {
    const linear = [u1, a1, u2, a2];
    const selection = selectionAfterDelete(linear, { [ROOT_KEY]: "u1", a1: "u2" }, "u2");
    expect(selection).toEqual({ [ROOT_KEY]: "u1" });
    const remaining = removeMessageBranch({ messages: linear, quota }, "u2").messages;
    expect(resolveThread(remaining, selection).map((e) => e.message.id)).toEqual(["u1", "a1"]);
    expect(selectionAfterDelete(linear, selection, "inconnu")).toBe(selection);
  });

  it("removeMessageBranch retire le message, sa réponse et sa descendance", () => {
    const next = removeMessageBranch({ messages: all, quota }, "u1");
    expect(next.messages.map((m) => m.id).sort()).toEqual(["a1b", "u1b"]);
    expect(next.quota).toBe(quota);
    expect(removeMessageBranch({ messages: all, quota }, "inconnu").messages).toHaveLength(all.length);
  });

  it("historique sans parent_id : chaîne chronologique, sans versions multiples", () => {
    const legacy = [message("q2", at(10)), message("q1", at(8)), message("r1", at(9), "assistant")];
    const thread = resolveThread(legacy);
    expect(thread.map((e) => e.message.id)).toEqual(["q1", "r1", "q2"]);
    expect(thread[2].versions).toMatchObject({ parentKey: "r1", index: 1, count: 1 });
  });
});
