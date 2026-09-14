import {
  HardwareSupport,
  ModelProgress,
  ModelVariant,
  ProcessOptions,
  ProcessResult,
  RuntimeDevice,
} from './types';
import { detectHardwareCapabilities, isMobileOrLowPowerDevice } from './detector';

// Cache loaded pipelines in memory for instant subsequent runs
const pipelineCache: Record<string, any> = {};

// Deduplicate in-flight loading promises
const activeLoadingPromises = new Map<
  string,
  Promise<{ pipeline: any; runtime: RuntimeDevice; modelName: string }>
>();

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

    const modelId: string =
      variant === 'birefnet'
        ? 'onnx-community/BiRefNet-ONNX'
        : 'briaai/RMBG-1.4';

    const cacheKey = `${modelId}:${targetDevice}`;

    // Check in-memory instance
    if (pipelineCache[cacheKey]) {
      this.activePipeline = pipelineCache[cacheKey];
      this.currentModelVariant = variant;
      this.currentDevice = targetDevice;
      onProgress?.({
        status: 'loading',
        stage: 'using-cached-model',
        message: 'Using cached model',
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

    // Check if loading is already in-flight to prevent duplicate downloads
    const existingTask = activeLoadingPromises.get(cacheKey);
    if (existingTask) {
      return existingTask;
    }

    const loadTask = (async () => {
      // 2. Check browser persistence cache
      const isCached = await isModelCachedInBrowser(modelId);
      const isFirstTime = !isCached;

      if (isCached) {
        onProgress?.({
          status: 'loading',
          stage: 'using-cached-model',
          message: 'Using cached model',
          progress: 100,
          runtime: targetDevice,
          webgpuAvailable: hardware.webgpu,
          isFirstTime: false,
        });
      } else {
        onProgress?.({
          status: 'downloading',
          stage: 'preparing-model',
          message: 'Preparing model...',
          progress: 0,
          runtime: targetDevice,
          webgpuAvailable: hardware.webgpu,
          isFirstTime: true,
        });
      }

      // Dynamically import transformers.js to prevent SSR issues
      const { pipeline, env, AutoConfig } = await import(
        '@huggingface/transformers'
      );

      // Configure client-side environment for browser cache persistence
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // Optimize ONNX wasm threading to prevent starving the UI event loop
      if (env.backends?.onnx?.wasm) {
        const hardwareConcurrency =
          typeof navigator !== 'undefined' && navigator.hardwareConcurrency
            ? navigator.hardwareConcurrency
            : 4;
        const safeThreads = Math.max(1, Math.min(3, hardwareConcurrency - 1));
        env.backends.onnx.wasm.numThreads = safeThreads;
        env.backends.onnx.wasm.simd = true;
      }

      // Real progress callback following actual byte downloads
      let lastProgressTick = 0;
      const progressCallback = (info: any) => {
        if (this.isAborted) return;
        if (info.status === 'progress') {
          const now = performance.now();
          // Throttle UI progress dispatches to prevent React state churn freeze
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
            message: 'Preparing model...',
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
              message: 'Preparing model...',
              runtime: targetDevice,
              webgpuAvailable: hardware.webgpu,
              isFirstTime: true,
            });
          }
        }
      };

      // Try candidate models: primary requested model first, with fallback to Xenova/modnet if primary model fails
      const candidateModels: string[] = [
        modelId,
        ...(modelId !== 'Xenova/modnet' ? ['Xenova/modnet'] : []),
      ];

      let segmenter: any = null;
      let actualRuntime: RuntimeDevice = targetDevice;
      let usedModelId = modelId;
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
          } catch (cfgErr) {
            console.warn('[BackgroundRemover] AutoConfig note:', cfgErr);
          }
        }

        // Try primary device (e.g. WebGPU) first, then CPU/WASM
        const devicesToTry: RuntimeDevice[] =
          targetDevice === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];

        for (const dev of devicesToTry) {
          try {
            if (dev === 'wasm' && targetDevice === 'webgpu') {
              onProgress?.({
                status: 'loading',
                stage: 'preparing-model',
                message: 'WebGPU unavailable • Using WASM fallback',
                progress: 50,
                runtime: 'wasm',
                webgpuAvailable: false,
                fallbackTriggered: true,
                isFirstTime,
              });
            }

            // Yield control so UI animations render smoothly before compiling ONNX session
            await new Promise((resolve) => setTimeout(resolve, 50));

            // In browser environment, transformers.js expects 'webgpu' or 'wasm'
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
            console.warn(
              `[BackgroundRemover] Model ${currentModel} on ${dev} failed:`,
              devErr
            );
            lastError = devErr;
          }
        }

        if (segmenter) {
          break;
        }
      }

      if (!segmenter) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`planner_bg_model_cached_${modelId}`);
          }
        } catch {
          // ignore
        }
        console.error('[BackgroundRemover] All model candidates failed:', lastError);
        throw new Error(
          lastError?.message || 'Model gagal dipersiapkan. Silakan coba lagi.'
        );
      }

      // Mark model as cached in memory & browser persistence
      pipelineCache[cacheKey] = segmenter;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`planner_bg_model_cached_${modelId}`, 'true');
          localStorage.setItem(`planner_bg_model_cached_${usedModelId}`, 'true');
        }
      } catch {
        // Ignore localStorage quota errors
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
      const result = await loadTask;
      return result;
    } finally {
      activeLoadingPromises.delete(cacheKey);
    }
  }

  /**
   * Process an image file or object URL to remove the background.
   */
  public async removeBackground(
    source: File | Blob | string,
    options: ProcessOptions = {},
    onProgress?: (progress: ModelProgress) => void
  ): Promise<ProcessResult> {
    const startTime = performance.now();
    this.isAborted = false;

    const variant = options.modelVariant || 'rmbg-1.4';
    const { pipeline: segmenter, runtime: runtimeUsed, modelName } =
      await this.loadModel(variant, options.forceDevice, onProgress);

    if (this.isAborted) {
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    // Step 1: Preparing image...
    onProgress?.({
      status: 'processing',
      stage: 'preparing-image',
      progress: 25,
      message: 'Preparing image...',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    // Yield control briefly to ensure non-blocking browser UI rendering
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Load original image as an Image element
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

    // Adaptive downscale for memory safety and UI responsiveness:
    // If the user specified maxDimension, respect it.
    // If not specified (0) but the input is massive (e.g. >2048px on desktop or >1280px on mobile),
    // cap the inference input to prevent browser GPU/RAM freeze while preserving original resolution for final mask composite.
    const userMaxDim = options.maxDimension ?? 0;
    const isMobile = isMobileOrLowPowerDevice();
    const autoCapDim = isMobile ? 1280 : 2048;
    const effectiveInferenceMaxDim =
      userMaxDim > 0 ? userMaxDim : (origWidth > autoCapDim || origHeight > autoCapDim ? autoCapDim : 0);

    let inferenceUrl = sourceUrl;
    let needRevokeInferenceUrl = false;

    if (effectiveInferenceMaxDim > 0 && (origWidth > effectiveInferenceMaxDim || origHeight > effectiveInferenceMaxDim)) {
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
      if (resizeCtx) {
        resizeCtx.drawImage(origImg, 0, 0, scaledW, scaledH);
        const scaledBlob = await new Promise<Blob | null>((res) =>
          resizeCanvas.toBlob(res, 'image/png')
        );
        if (scaledBlob) {
          inferenceUrl = URL.createObjectURL(scaledBlob);
          needRevokeInferenceUrl = true;
        }
      }
    }

    if (this.isAborted) {
      if (needRevokeInferenceUrl) URL.revokeObjectURL(inferenceUrl);
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    // Step 2: Removing background...
    onProgress?.({
      status: 'processing',
      stage: 'removing-bg',
      progress: 60,
      message: 'Removing background...',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    // Generous yield to allow browser layout, paint, and animations to run cleanly before AI inference
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Run segmenter inference
    let output: any;
    try {
      output = await segmenter(inferenceUrl);
    } catch (err: any) {
      if (needRevokeInferenceUrl) URL.revokeObjectURL(inferenceUrl);
      throw new Error(
        `Inferensi AI gagal: ${err?.message || 'Memori browser mungkin tidak mencukupi.'}`
      );
    } finally {
      if (needRevokeInferenceUrl) {
        URL.revokeObjectURL(inferenceUrl);
      }
    }

    if (this.isAborted) {
      throw new Error('Proses dibatalkan oleh pengguna.');
    }

    // Step 3: Finalizing...
    onProgress?.({
      status: 'processing',
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing...',
      runtime: runtimeUsed,
      webgpuAvailable: runtimeUsed === 'webgpu',
    });

    // Yield control briefly to ensure smooth UI transition to finalizing stage
    await new Promise((resolve) => setTimeout(resolve, 40));

    // Extract mask or transparent image
    let finalCanvas: HTMLCanvasElement;
    let maskData: Uint8ClampedArray;

    if (output && output.data && output.width && output.height) {
      // output is RawImage
      const outW = output.width;
      const outH = output.height;

      maskData = new Uint8ClampedArray(outW * outH);
      if (output.channels === 4) {
        for (let i = 0; i < maskData.length; i++) {
          maskData[i] = output.data[i * 4 + 3];
        }
      } else if (output.channels === 1) {
        maskData.set(output.data);
      } else {
        maskData.fill(255);
      }

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = outW;
      maskCanvas.height = outH;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Gagal menginisialisasi canvas context.');

      const maskImgData = maskCtx.createImageData(outW, outH);
      // Fast typed array transfer using 32-bit Uint32Array view
      const imgData32 = new Uint32Array(maskImgData.data.buffer);
      for (let i = 0; i < maskData.length; i++) {
        const val = maskData[i];
        imgData32[i] = (val << 24) | (val << 16) | (val << 8) | val;
      }
      maskCtx.putImageData(maskImgData, 0, 0);

      finalCanvas = document.createElement('canvas');
      finalCanvas.width = origWidth;
      finalCanvas.height = origHeight;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Gagal menginisialisasi canvas context.');

      finalCtx.drawImage(origImg, 0, 0, origWidth, origHeight);
      finalCtx.globalCompositeOperation = 'destination-in';
      finalCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
      finalCtx.globalCompositeOperation = 'source-over';
    } else if (Array.isArray(output) && output[0]?.mask) {
      // output is from ImageSegmentationPipeline: [{ mask: RawImage }]
      const maskRaw = output[0].mask;
      const outW = maskRaw.width;
      const outH = maskRaw.height;
      maskData = new Uint8ClampedArray(maskRaw.data);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = outW;
      maskCanvas.height = outH;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Gagal menginisialisasi canvas context.');

      const maskImgData = maskCtx.createImageData(outW, outH);
      // Fast typed array transfer using 32-bit Uint32Array view
      const imgData32 = new Uint32Array(maskImgData.data.buffer);
      for (let i = 0; i < maskData.length; i++) {
        const val = maskData[i];
        imgData32[i] = (val << 24) | (val << 16) | (val << 8) | val;
      }
      maskCtx.putImageData(maskImgData, 0, 0);

      finalCanvas = document.createElement('canvas');
      finalCanvas.width = origWidth;
      finalCanvas.height = origHeight;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Gagal menginisialisasi canvas context.');

      finalCtx.drawImage(origImg, 0, 0, origWidth, origHeight);
      finalCtx.globalCompositeOperation = 'destination-in';
      finalCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
      finalCtx.globalCompositeOperation = 'source-over';
    } else {
      throw new Error('Format output model tidak dikenal.');
    }

    // Export transparent PNG blob
    const transparentBlob = await new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal mengonversi canvas ke Blob PNG.'));
        },
        'image/png',
        1.0
      );
    });

    const transparentUrl = URL.createObjectURL(transparentBlob);
    const duration = Math.round(performance.now() - startTime);

    // Step 4: Completed
    onProgress?.({
      status: 'done',
      stage: 'done',
      progress: 100,
      message: '✓ Background removed',
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
  }
}

export const backgroundRemover = new BackgroundRemoverEngine();
