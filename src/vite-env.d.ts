/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
}

interface WakeLock {
  request(type: "screen"): Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: WakeLock;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}
