export class EngineSim {
  constructor(
    audioContext?: AudioContext | null,
    options?: {
      engine?: string;
      vehicle?: string;
      volume?: number;
      destination?: AudioNode;
    }
  );

  readonly running: boolean;
  start(): Promise<void>;
  stop(): void;
  dispose(): void;
  setThrottle(value: number): void;
  setVolume(value: number): void;
  update(deltaTime: number): void;
}
