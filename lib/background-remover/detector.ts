import { HardwareSupport } from './types';

let cachedSupport: HardwareSupport | null = null;

export async function detectHardwareCapabilities(): Promise<HardwareSupport> {
  if (cachedSupport) return cachedSupport;

  if (typeof window === 'undefined') {
    return {
      webgpu: false,
      wasm: true,
      recommended: 'wasm',
    };
  }

  let webgpuSupported = false;
  let gpuName: string | undefined;

  // 1. Check WebGPU
  if ('gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function') {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        webgpuSupported = true;
        try {
          const info = await adapter.requestAdapterInfo?.();
          if (info?.device || info?.description) {
            gpuName = info.description || info.device;
          }
        } catch {
          // Non-critical adapter info error
        }
      }
    } catch (e) {
      console.warn('[BackgroundRemover] WebGPU detection error:', e);
      webgpuSupported = false;
    }
  }

  // 2. Check WASM
  let wasmSupported = false;
  try {
    wasmSupported = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  } catch {
    wasmSupported = false;
  }

  cachedSupport = {
    webgpu: webgpuSupported,
    wasm: wasmSupported,
    recommended: webgpuSupported ? 'webgpu' : 'wasm',
    gpuName,
  };

  return cachedSupport;
}

export function isMobileOrLowPowerDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const isMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      ua
    );
  const isTouchDevice =
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1 &&
    window.innerWidth < 1024;
  return isMobileUa || isTouchDevice;
}
