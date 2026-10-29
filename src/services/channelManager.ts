export interface ChannelAccountRecord {
  publicKey: string;
  isAvailable: boolean;
  lastUsedTimestamp: number;
}

export class StellarChannelManager {
  private channels: ChannelAccountRecord[] = [];

  constructor(channelPublicKeys: string[] = []) {
    this.channels = channelPublicKeys.map(k => ({
      publicKey: k,
      isAvailable: true,
      lastUsedTimestamp: 0,
    }));
  }

  public acquireChannel(): ChannelAccountRecord | undefined {
    const channel = this.channels.find(c => c.isAvailable);
    if (channel) {
      channel.isAvailable = false;
      channel.lastUsedTimestamp = Date.now();
    }
    return channel;
  }

  public releaseChannel(publicKey: string): void {
    const channel = this.channels.find(c => c.publicKey === publicKey);
    if (channel) {
      channel.isAvailable = true;
    }
  }

  public getChannelCount(): number {
    return this.channels.length;
  }
}

export const globalChannelManager = new StellarChannelManager([
  'GACHANNELDEMO1111111111111111111111111111111111111111111111',
  'GACHANNELDEMO2222222222222222222222222222222222222222222222',
]);
