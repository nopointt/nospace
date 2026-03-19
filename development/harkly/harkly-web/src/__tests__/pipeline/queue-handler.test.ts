/**
 * Tests for src/lib/pipeline/queue-handler.ts — handleQueueMessage (default export .queue)
 *
 * The module exports a default object with a queue(batch, env) method.
 * It iterates batch.messages, calls processSource, then either acks (success)
 * or retries (attempts < 3) or acks again (attempts >= 3).
 *
 * Covers:
 * - success path: processSource resolves → message.ack() called
 * - failure with low attempts: processSource rejects → message.retry() called
 * - max attempts exceeded (attempts >= 3): processSource rejects → message.ack() called
 * - multiple messages in batch: each processed independently
 * - processSource called with correct env and sourceId
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock processSource before importing the handler ───────────────────────────

vi.mock("~/lib/pipeline/process-source", () => ({
  processSource: vi.fn().mockResolvedValue(undefined),
}));

import queueHandler from "~/lib/pipeline/queue-handler";
import { processSource } from "~/lib/pipeline/process-source";
import { createMockEnv } from "../mocks/cf-env";

// ── Message factory ───────────────────────────────────────────────────────────

function makeMessage(sourceId: string, attempts = 1) {
  return {
    body: { sourceId },
    attempts,
    ack: vi.fn(),
    retry: vi.fn(),
  };
}

// ── Batch factory ─────────────────────────────────────────────────────────────

function makeBatch(messages: ReturnType<typeof makeMessage>[]) {
  return { messages };
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(processSource).mockResolvedValue(undefined);
});

// ── Success path ──────────────────────────────────────────────────────────────

describe("queue handler — success path", () => {
  it("calls processSource with correct env and sourceId", async () => {
    const env = createMockEnv();
    const msg = makeMessage("source-abc");
    await queueHandler.queue(makeBatch([msg]) as any, env as any);
    expect(processSource).toHaveBeenCalledWith(env, "source-abc");
  });

  it("calls message.ack() on success", async () => {
    const env = createMockEnv();
    const msg = makeMessage("source-abc");
    await queueHandler.queue(makeBatch([msg]) as any, env as any);
    expect(msg.ack).toHaveBeenCalledTimes(1);
    expect(msg.retry).not.toHaveBeenCalled();
  });

  it("acks all messages when all succeed", async () => {
    const env = createMockEnv();
    const messages = [makeMessage("s-1"), makeMessage("s-2"), makeMessage("s-3")];
    await queueHandler.queue(makeBatch(messages) as any, env as any);
    for (const msg of messages) {
      expect(msg.ack).toHaveBeenCalledTimes(1);
      expect(msg.retry).not.toHaveBeenCalled();
    }
  });
});

// ── Failure with retry ────────────────────────────────────────────────────────

describe("queue handler — failure with retry", () => {
  it("calls message.retry() when processSource throws and attempts < 3", async () => {
    vi.mocked(processSource).mockRejectedValueOnce(new Error("transient error"));

    const env = createMockEnv();
    const msg = makeMessage("source-xyz", 1); // attempts=1 < 3
    await queueHandler.queue(makeBatch([msg]) as any, env as any);

    expect(msg.retry).toHaveBeenCalledTimes(1);
    expect(msg.ack).not.toHaveBeenCalled();
  });

  it("retries when attempts is 2 (< 3)", async () => {
    vi.mocked(processSource).mockRejectedValueOnce(new Error("error"));

    const env = createMockEnv();
    const msg = makeMessage("source-xyz", 2);
    await queueHandler.queue(makeBatch([msg]) as any, env as any);

    expect(msg.retry).toHaveBeenCalledTimes(1);
    expect(msg.ack).not.toHaveBeenCalled();
  });
});

// ── Max attempts exceeded ─────────────────────────────────────────────────────

describe("queue handler — max attempts exceeded", () => {
  it("calls message.ack() (not retry) when attempts >= 3", async () => {
    vi.mocked(processSource).mockRejectedValueOnce(new Error("permanent failure"));

    const env = createMockEnv();
    const msg = makeMessage("source-xyz", 3); // attempts=3, NOT retried
    await queueHandler.queue(makeBatch([msg]) as any, env as any);

    expect(msg.ack).toHaveBeenCalledTimes(1);
    expect(msg.retry).not.toHaveBeenCalled();
  });

  it("acks (not retries) when attempts is 4", async () => {
    vi.mocked(processSource).mockRejectedValueOnce(new Error("error"));

    const env = createMockEnv();
    const msg = makeMessage("source-xyz", 4);
    await queueHandler.queue(makeBatch([msg]) as any, env as any);

    expect(msg.ack).toHaveBeenCalledTimes(1);
    expect(msg.retry).not.toHaveBeenCalled();
  });
});

// ── Mixed batch ───────────────────────────────────────────────────────────────

describe("queue handler — mixed batch", () => {
  it("processes success and failure messages independently", async () => {
    vi.mocked(processSource)
      .mockResolvedValueOnce(undefined) // first message succeeds
      .mockRejectedValueOnce(new Error("fail")) // second fails with retry
      .mockRejectedValueOnce(new Error("fail")); // third fails with max attempts

    const env = createMockEnv();
    const msg1 = makeMessage("s-1", 1);
    const msg2 = makeMessage("s-2", 1); // attempts < 3 → retry
    const msg3 = makeMessage("s-3", 3); // attempts >= 3 → ack

    await queueHandler.queue(makeBatch([msg1, msg2, msg3]) as any, env as any);

    expect(msg1.ack).toHaveBeenCalledTimes(1);
    expect(msg1.retry).not.toHaveBeenCalled();

    expect(msg2.retry).toHaveBeenCalledTimes(1);
    expect(msg2.ack).not.toHaveBeenCalled();

    expect(msg3.ack).toHaveBeenCalledTimes(1);
    expect(msg3.retry).not.toHaveBeenCalled();
  });

  it("processes all messages even if one throws", async () => {
    vi.mocked(processSource)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);

    const env = createMockEnv();
    const msg1 = makeMessage("s-1", 1);
    const msg2 = makeMessage("s-2", 1);

    await queueHandler.queue(makeBatch([msg1, msg2]) as any, env as any);

    // Both messages handled (either ack or retry)
    expect(msg1.retry).toHaveBeenCalledTimes(1);
    expect(msg2.ack).toHaveBeenCalledTimes(1);
  });
});
