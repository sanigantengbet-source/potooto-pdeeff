export type RuntimeDevice = 'webgpu' | 'wasm';

export interface HardwareSupport {
  webgpu: boolean;
  wasm: boolean;
  recommended: RuntimeDevice;
  gpuName?: string;
}

export type ProcessingStage =
  | 'idle'
  | 'preparing-model'       // First-time model download & compilation
  | 'using-cached-model'    // Model loaded instantly from memory/cache
  | 'preparing-image'       // Decoding image & sizing
  | 'removing-bg'           // Running neural network inference
  | 'finalizing'            // Applying alpha mask & generating high-res PNG
  | 'done'                  // Background removed successfully
  | 'error';

export interface ModelProgress {
  status: 'idle' | 'checking' | 'downloading' | 'loading' | 'processing' | 'done' | 'error';
  stage?: ProcessingStage;
  progress?: number; // 0 - 100 (real tracking)
  message: string;
  runtime?: RuntimeDevice;
  webgpuAvailable?: boolean;
  fallbackTriggered?: boolean;
  isFirstTime?: boolean;
  detail?: string;
}

export type ModelVariant = 'rmbg-1.4' | 'birefnet';
export type SupportedModelId =
  | 'onnx-community/BiRefNet-ONNX'
  | 'briaai/RMBG-1.4'
  | 'Xenova/modnet';

export interface ProcessOptions {
  modelVariant?: ModelVariant;
  forceDevice?: RuntimeDevice;
  maxDimension?: number; // 0 for unlimited, or e.g. 1600 for mobile RAM safety
  featherRadius?: number; // 0 - 10 for edge smoothing
}

export interface ProcessResult {
  originalUrl: string;
  transparentUrl: string;
  transparentBlob: Blob;
  maskData: Uint8ClampedArray;
  width: number;
  height: number;
  runtimeUsed: RuntimeDevice;
  processingTimeMs: number;
  modelUsed: string;
}
