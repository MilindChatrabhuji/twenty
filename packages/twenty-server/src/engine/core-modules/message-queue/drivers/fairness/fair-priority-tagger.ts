import { Logger } from '@nestjs/common';

import { type RedisClient } from 'bullmq';

import { FAIR_TAG_SCRIPT } from 'src/engine/core-modules/message-queue/drivers/fairness/fair-tag-script.constant';
import { RESET_FAIR_EPOCH_SCRIPT } from 'src/engine/core-modules/message-queue/drivers/fairness/reset-fair-epoch-script.constant';
import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

const FAIR_CLOCK_TTL_MS = 24 * 60 * 60 * 1000;
const VIRTUAL_TIME_MEMBER = 'v';

export class FairPriorityTagger {
  private readonly logger = new Logger(FairPriorityTagger.name);

  constructor(
    private readonly getClient: (
      queueName: MessageQueue,
    ) => Promise<RedisClient>,
    private readonly keyPrefix: string,
  ) {}

  async tag({
    queueName,
    groupKeys,
    batchSize,
  }: {
    queueName: MessageQueue;
    groupKeys: string[];
    batchSize: number;
  }): Promise<number | undefined> {
    try {
      const client = await this.getClient(queueName);
      const keys = [
        this.buildKey(queueName, 'epoch'),
        this.buildKey(queueName, 'vtime'),
        this.buildKey(queueName, 'weights'),
        ...groupKeys.map((groupKey) =>
          this.buildKey(queueName, `clock:${groupKey}`),
        ),
      ];

      const tag: unknown = await client.runCommand('eval', [
        FAIR_TAG_SCRIPT,
        keys.length,
        ...keys,
        batchSize,
        FAIR_CLOCK_TTL_MS,
        ...groupKeys,
      ]);

      return Number(tag);
    } catch (error) {
      this.logger.warn(
        `Fair tag failed on queue ${queueName}, falling back to the static priority: ${error instanceof Error ? error.message : String(error)}`,
      );

      return undefined;
    }
  }

  async dispatched({
    queueName,
    tag,
  }: {
    queueName: MessageQueue;
    tag: number;
  }): Promise<void> {
    const client = await this.getClient(queueName);

    await client.runCommand('zadd', [
      this.buildKey(queueName, 'vtime'),
      'GT',
      tag,
      VIRTUAL_TIME_MEMBER,
    ]);
  }

  async resetEpoch(queueName: MessageQueue): Promise<void> {
    const client = await this.getClient(queueName);

    await client.runCommand('eval', [
      RESET_FAIR_EPOCH_SCRIPT,
      2,
      this.buildKey(queueName, 'epoch'),
      this.buildKey(queueName, 'vtime'),
    ]);
  }

  private buildKey(queueName: MessageQueue, suffix: string): string {
    return `${this.keyPrefix}:${queueName}:fair:${suffix}`;
  }
}
