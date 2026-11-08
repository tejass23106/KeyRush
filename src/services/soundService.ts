class SoundService {
  public unlock(): void {}

  public setEnabled(_enabled: boolean): void {}

  public setVolume(_volume: number): void {}

  public playTyping(): void {}

  public playCountdown(_count: number | 'go'): void {}

  public async startEngine(): Promise<void> {}

  public setEngineThrottle(_wpm: number): void {}

  public stopEngine(): void {}

  public playFinish(): void {}
}

export const soundService = new SoundService();