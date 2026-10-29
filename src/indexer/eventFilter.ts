export interface ContractEventFilter {
  contractId?: string;
  topic?: string;
  fromLedger?: number;
  toLedger?: number;
}

export function filterEventsByTopic(events: Array<{ topic: string }>, targetTopic: string): Array<{ topic: string }> {
  return events.filter(e => e.topic.toLowerCase().includes(targetTopic.toLowerCase()));
}
