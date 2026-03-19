import { processSource } from "./process-source";

interface Env {
  KB_DB: D1Database;
  HARKLY_R2: R2Bucket;
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Ai;
}

interface QueueMessage {
  sourceId: string;
}

export default {
  async queue(
    batch: MessageBatch<QueueMessage>,
    env: Env,
  ): Promise<void> {
    for (const message of batch.messages) {
      const { sourceId } = message.body;

      try {
        await processSource(env, sourceId);
        message.ack();
      } catch (error) {
        console.error(`Failed to process source ${sourceId}:`, error);
        if (message.attempts < 3) {
          message.retry();
        } else {
          console.error(`Max retries reached for source ${sourceId}, acking`);
          message.ack();
        }
      }
    }
  },
};
