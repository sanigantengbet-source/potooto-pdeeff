import {
  HardwareSupport,
  ModelProgress,
  ModelVariant,
  SupportedModelId,
  ProcessOptions,
  ProcessResult,
  RuntimeDevice,
} from './types';
import { detectHardwareCapabilities, isMobileOrLowPowerDevice } from './detector';

// Cache loaded pipelines in memory for fallback runs
const pipelineCache: Record<string, any> = {};

// Deduplicate in-flight loading promises
const activeLoadingPromises = new Map<
  string,
  Promise<{ pipeline: any; runtime: RuntimeDevice; modelName: string }>
>();

let workerInstance: Worker | null = null;
let currentTaskId = 0;

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      console.warn(
        '[BackgroundRemover] Web Worker initialization failed, falling back to main-thread processing:',
        err
      );
      workerInstance = null;
    }
  }
  return workerInstance;
}

/**
 * Check if the model is already stored in browser Cache API or localStorage.
 */
export async function isModelCachedInBrowser(modelId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(`planner_bg_model_cached_${modelId}`) === 'true') {
      return true;
    }
    if ('caches' in window) {
      const hasCache = await window.caches.has('transformers-cache');
      if (hasCache) {
        const cache = await window.caches.open('transformers-cache');
        const keys = await cache.keys();
        const found = keys.some(
          (req) => req.url.includes(modelId) || req.url.includes('model.onnx')
        );
        if (found) {
          localStorage.setItem(`planner_bg_model_cached_${modelId}`, 'true');
          return true;
        }
      }
    }
  } catch {
    // Ignore cache access issues
  }
  return false;
}

export class BackgroundRemoverEngine {
  private activePipeline: any = null;
  private currentModelVariant: ModelVariant | null = null;
  private currentDevice: RuntimeDevice | null = null;
  private isAborted: boolean = false;

  public abort() {
    this.isAborted = true;
    if (workerInstance) {
      workerInstance.postMessage({ type: 'abort' });
    }
  }

  /**
   * Loads the model pipeline lazily with first-time vs cached detection.
   */
  public async loadModel(
    variant: ModelVariant = 'rmbg-1.4',
    forceDevice?: RuntimeDevice,
    onProgress?: (progress: ModelProgress) => void
  ): Promise<{ pipeline: any; runtime: RuntimeDevice; modelName: string }> {
    this.isAborted = false;

    // 1. Detect hardware capabilities
    const hardware: HardwareSupport = await detectHardwareCapabilities();
    const targetDevice: RuntimeDevice =
      forceDevice || (hardware.webgpu ? 'webgpu' : 'wasm');

    const modelId: SupportedModelId =
      variant === 'birefnet'
        ? 'onnx-community/BiRefNet-ONNX'
        : 'briaai/RMBG-1.4';

    const cacheKey = `${modelId}:${targetDevice}`;

    if (pipelineCache[cacheKey]) {
      this.activePipeline = pipelineCache[cacheKey];
      this.currentModelVariant = variant;
      this.currentDevice = targetDevice;
      onProgress?.({
        status: 'loading',
        stage: 'using-cached-model',
        message: 'Menggunakan model dari cache',
        progress: 100,
        runtime: targetDevice,
        webgpuAvailable: hardware.webgpu,
        isFirstTime: false,
      });
      return {
        pipeline: this.activePipeline,
        runtime: targetDevice,
        modelName: modelId,
      };
    }

    const existingTask = activeLoadingPromises.get(cacheKey);
    if (existingTask) {
      return existingTask;
    }

    const loadTask = (async () => {
      const isCached = await isModelCachedInBrowser(modelId);
      const isFirstTime = !isCached;

      if (isCached) {
        onProgress?.({
          status: 'loading',
          stage: 'using-cached-model',
          message: 'Menggunakan model dari cache',
          progress: 100,
          runtime: targetDevice,
          webgpuAvailable: hardware.webgpu,
          isFirstTime: false,
        });
      } else {
        onProgress?.({
          status: 'downloading',
          stage: 'preparing-model',
          message: 'Mempersiapkan model AI...',
          progress: 0,
          runtime: targetDevice,
          webgpuAvailable: hardware.webgpu,
          isFirstTime: true,
        });
      }

      const { pipeline, env, AutoConfig } = await import(
        '@huggingface/transformers'
      );

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.simd = true;
        env.backends.onnx.wasm.proxy = false;
      }

      let lastProgressTick = 0;
      const progressCallback = (info: any) => {
        if (this.isAborted) return;
        if (info.status === 'progress') {
          const now = performance.now();
          if (now - lastProgressTick < 80 && info.progress < 100) return;
          lastProgressTick = now;

          const realPercent = Math.min(
            100,
            Math.max(0, Math.round(info.progress ?? 0))
          );
          onProgress?.({
            status: 'downloading',
            stage: 'preparing-model',
            progress: realPercent,
            message: 'Mendownload model AI...',
            runtime: targetDevice,
            webgpuAvailable: hardware.webgpu,
            isFirstTime: true,
            detail: info.file ? `${info.file}` : undefined,
          });
        } else if (info.status === 'ready' || info.status === 'done') {
          if (!isCached) {
            onProgress?.({
              status: 'loading',
              stage: 'preparing-model',
              progress: 100,
              message: 'Model AI siap digunakan',
              runtime: targetDevice,
              webgpuAvailable: hardware.webgpu,
              isFirstTime: true,
            });
          }
        }
      };

      const candidateModels: SupportedModelId[] = [
        modelId,
        ...((modelId as string) !== 'Xenova/modnet'
          ? (['Xenova/modnet'] as SupportedModelId[])
          : []),
      ];

      let segmenter: any = null;
      let actualRuntime: RuntimeDevice = targetDevice;
      let usedModelId: SupportedModelId = modelId;
      let lastError: any = null;

      for (const currentModel of candidateModels) {
        let modelConfig: any = undefined;
        if (currentModel === 'briaai/RMBG-1.4') {
          try {
            const conf = await AutoConfig.from_pretrained(currentModel);
            if (
              conf &&
              (conf.model_type === 'SegformerForSemanticSegmentation' ||
                conf.model_type === 'BriaRMBG')
            ) {
              conf.model_type = 'segformer';
            }
            modelConfig = conf;
          } catch {
            // non-critical
          }
        }

        const devicesToTry: RuntimeDevice[] =
          targetDevice === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];

        for (const dev of devicesToTry) {
          try {
            if (dev === 'wasm' && targetDevice === 'webgpu') {
              onProgress?.({
                status: 'loading',
                stage: 'preparing-model',
                message: 'WebGPU tidak tersedia • Beralih ke WASM',
                progress: 50,
                runtime: 'wasm',
                webgpuAvailable: false,
                fallbackTriggered: true,
                isFirstTime,
              });
            }

            await new Promise((resolve) => setTimeout(resolve, 30));

            const deviceParam = dev === 'webgpu' ? 'webgpu' : 'wasm';
            segmenter = await (pipeline as any)('background-removal', currentModel, {
              ...(modelConfig ? { config: modelConfig } : {}),
              device: deviceParam,
              progress_callback: progressCallback,
            });

            actualRuntime = dev;
            usedModelId = currentModel;
            break;
          } catch (devErr: any) {
            lastError = devErr;
          }
        }

        if (segmenter) break;
      }

      if (!segmenter) {
        throw new Error(
          lastError?.message || 'Model AI gagal dipersiapkan. Silakan coba lagi.'
        );
      }

      pipelineCache[cacheKey] = segmenter;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`planner_bg_model_cached_${modelId}`, 'true');
          localStorage.setItem(`planner_bg_model_cached_${usedModelId}`, 'true');
        }
      } catch {
        // ignore
      }

      this.activePipeline = segmenter;
      this.currentModelVariant = variant;
      this.currentDevice = actualRuntime;

      return {
        pipeline: segmenter,
        runtime: actualRuntime,
        modelName: usedModelId,
      };
    })();

    activeLoadingPromises.set(cacheKey, loadTask);
    try {
      return await loadTask;
    } finally {
      activeLoadingPromises.delete(cacheKey);
    }
  }

  /**
   * Process an image file or object URL to remove the background with non-blocking execution.
   */
  public async removeBackground(
    source: File | Blob | string,
    options: ProcessOptions = {},
    onProgress?: (progress: ModelProgress) => void
  ): Promise<ProcessResult> {
    const startTime = performance.now();
    this.isAborted = false;

    const hardware = await detectHardwareCapabilities();

    onProgress?.({
      status: 'processing',
      stage: 'preparing-image',
      progress: 10,
      message: 'Membaca dan mempersiapkan gambar...',
      runtime: options.forceDevice || (hardware.webgpu ? 'webgpu' : 'wasm'),
      webgpuAvailable: hardware.webgpu,
    });

    // Yield control so UI renders smoothly
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Load original image to obtain true natural dimensions
    const sourceUrl =
      typeof source === 'string' ? source : URL.createObjectURL(source);

    const origImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal memuat gambar sumber.'));
      img.src = sourceUrl;
    });

    const origWidth = origImg.naturalWidth || origImg.width;
    const origHeight = origImg.naturalHeight || origImg.height;

    // Adaptive downscale for inference to keep memory light and lightning fast
    const userMaxDim = options.maxDimension ?? 0;
    const isMobile = isMobileOrLowPowerDevice();
    const autoCapDim = isMobile ? 1024 : 2048;
    const effectiveInferenceMaxDim =
      userMaxDim > 0
        ? userMaxDim
        : origWidth > autoCapDim || origHeight > autoCapDim
        ? autoCapDim
        : 0;

    let inferenceBlob: Blob;
    if (
      effectiveInferenceMaxDim > 0 &&
      (origWidth > effectiveInferenceMaxDim || origHeight > effectiveInferenceMaxDim)
    ) {
      const scale = Math.min(
        effectiveInferenceMaxDim / origWidth,
        effectiveInferenceMaxDim / origHeight
      );
      const scaledW = Math.round(origWidth * scale);
      const scaledH = Math.round(origHeight * scale);

      const resizeCanvas = document.createElement('canvas');
      resizeCanvas.width = scaledW;
      resizeCanvas.height = scaledH;
      const resizeCtx = resizeCanvas.getContext('2d');
      if (!resizeCtx) throw new Error('Gagal membuat canvas resize.');
      resizeCtx.drawImage(origImg, 0, 0, scaledW, scaledH);

      const scaledBlob = await new Promise<Blob | null>((res) =>
        resizeCanvas.toBlob(res, 'image/jpeg', 0.92)
      );
      if (!scaledBlob) throw new Error('Gagal mengompresi gambar untuk inferensi.');
      inferenceBlob = scaledBlob;
    } else {
      if (source instanceof Blob) {
        inferenceBlob = source;
      } else {
        const resp = await fetch(sourceUrl);
        inferenceBlob = await resp.blob();
      }
    }

    if (this.isAborted) {
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    // Try executing in Web Worker for 100% non-blocking UI
    const worker = getWorker();
    if (worker) {
      try {
        const workerResult = await this.executeInWorker(
          worker,
          inferenceBlob,
          options,
          hardware.webgpu,
          onProgress
        );

        if (this.isAborted) {
          throw new Error('Proses dibatalkan oleh pengguna.');
        }

        // Composite the mask with original high-resolution image on main thread
        const finalTransparentBlob = await this.compositeMaskWithImage(
          origImg,
          origWidth,
          origHeight,
          workerResult.maskData,
          workerResult.maskWidth,
          workerResult.maskHeight
        );

        const transparentUrl = URL.createObjectURL(finalTransparentBlob);
        const duration = Math.round(performance.now() - startTime);

        onProgress?.({
          status: 'done',
          stage: 'done',
          progress: 100,
          message: '✓ Background berhasil dihapus',
          runtime: workerResult.runtimeUsed,
          webgpuAvailable: workerResult.runtimeUsed === 'webgpu',
        });

        return {
          originalUrl: sourceUrl,
          transparentUrl,
          transparentBlob: finalTransparentBlob,
          maskData: workerResult.maskData,
          width: origWidth,
          height: origHeight,
          runtimeUsed: workerResult.runtimeUsed,
          processingTimeMs: duration,
          modelUsed: workerResult.modelUsed,
        };
      } catch (workerErr: any) {
        console.warn(
          '[BackgroundRemover] Web Worker processing failed, falling back to main-thread engine:',
          workerErr
        );
      }
    }

    // Fallback: Main thread execution with non-blocking slicing
    return await this.removeBackgroundMainThread(
      sourceUrl,
      origImg,
      origWidth,
      origHeight,
      inferenceBlob,
      options,
      startTime,
      onProgress
    );
  }

  private executeInWorker(
    worker: Worker,
    imageBlob: Blob,
    options: ProcessOptions,
    hasWebGpu: boolean,
    onProgress?: (progress: ModelProgress) => void
  ): Promise<{
    maskData: Uint8ClampedArray;
    maskWidth: number;
    maskHeight: number;
    duration: number;
    runtimeUsed: RuntimeDevice;
    modelUsed: string;
  }> {
    return new Promise((resolve, reject) => {
      const taskId = ++currentTaskId;

      const messageHandler = (e: MessageEvent) => {
        const { type, id, payload } = e.data;
        if (id !== taskId) return;

        if (type === 'progress') {
          onProgress?.(payload);
        } else if (type === 'processDone') {
          worker.removeEventListener('message', messageHandler);
          resolve(payload);
        } else if (type === 'error') {
          worker.removeEventListener('message', messageHandler);
          reject(new Error(payload.message || 'Worker error'));
        }
      };

      worker.addEventListener('message', messageHandler);

      worker.postMessage({
        type: 'processImage',
        id: taskId,
        payload: {
          imageBlob,
          options,
          hasWebGpu,
        },
      });
    });
  }

  private async compositeMaskWithImage(
    origImg: HTMLImageElement,
    origWidth: number,
    origHeight: number,
    maskData: Uint8ClampedArray,
    maskWidth: number,
    maskHeight: number
  ): Promise<Blob> {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Gagal membuat context canvas mask.');

    const maskImgData = maskCtx.createImageData(maskWidth, maskHeight);
    const imgData32 = new Uint32Array(maskImgData.data.buffer);
    for (let i = 0; i < maskData.length; i++) {
      const val = maskData[i];
      imgData32[i] = (val << 24) | (val << 16) | (val << 8) | val;
    }
    maskCtx.putImageData(maskImgData, 0, 0);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = origWidth;
    finalCanvas.height = origHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Gagal membuat context canvas final.');

    finalCtx.drawImage(origImg, 0, 0, origWidth, origHeight);
    finalCtx.globalCompositeOperation = 'destination-in';
    finalCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
    finalCtx.globalCompositeOperation = 'source-over';

    return new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal membuat file gambar PNG transparan.'));
        },
        'image/png',
        1.0
      );
    });
  }

  private async removeBackgroundMainThread(
    sourceUrl: string,
    origImg: HTMLImageElement,
    origWidth: number,
    origHeight: number,
    inferenceBlob: Blob,
    options: ProcessOptions,
    startTime: number,
    onProgress?: (progress: ModelProgress) => void
  ): Promise<ProcessResult> {
    const variant = options.modelVariant || 'rmbg-1.4';
    const { pipeline: segmenter, runtime: runtimeUsed, modelName } =
      await this.loadModel(variant, options.forceDevice, onProgress);

    if (this.isAborted) {
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    onProgress?.({
      status: 'processing',
      stage: 'removing-bg',
      progress: 60,
      message: 'Menghapus latar belakang...',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const inferenceUrl = URL.createObjectURL(inferenceBlob);
    let output: any;
    try {
      output = await segmenter(inferenceUrl);
    } finally {
      URL.revokeObjectURL(inferenceUrl);
    }

    if (this.isAborted) {
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    onProgress?.({
      status: 'processing',
      stage: 'finalizing',
      progress: 90,
      message: 'Menyusun hasil akhir...',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    await new Promise((resolve) => setTimeout(resolve, 30));

    let maskData: Uint8ClampedArray;
    let maskW = 0;
    let maskH = 0;

    if (output && output.data && output.width && output.height) {
      maskW = output.width;
      maskH = output.height;
      maskData = new Uint8ClampedArray(maskW * maskH);
      if (output.channels === 4) {
        for (let i = 0; i < maskData.length; i++) {
          maskData[i] = output.data[i * 4 + 3];
        }
      } else if (output.channels === 1) {
        maskData.set(output.data);
      } else {
        maskData.fill(255);
      }
    } else if (Array.isArray(output) && output[0]?.mask) {
      const maskRaw = output[0].mask;
      maskW = maskRaw.width;
      maskH = maskRaw.height;
      maskData = new Uint8ClampedArray(maskRaw.data);
    } else {
      throw new Error('Format output model tidak dikenal.');
    }

    const transparentBlob = await this.compositeMaskWithImage(
      origImg,
      origWidth,
      origHeight,
      maskData,
      maskW,
      maskH
    );

    const transparentUrl = URL.createObjectURL(transparentBlob);
    const duration = Math.round(performance.now() - startTime);

    onProgress?.({
      status: 'done',
      stage: 'done',
      progress: 100,
      message: '✓ Background berhasil dihapus',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    return {
      originalUrl: sourceUrl,
      transparentUrl,
      transparentBlob,
      maskData,
      width: origWidth,
      height: origHeight,
      runtimeUsed,
      processingTimeMs: duration,
      modelUsed: modelName,
    };
  }

  public dispose() {
    this.activePipeline = null;
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }
  }
}

export const backgroundRemover = new BackgroundRemoverEngine();
