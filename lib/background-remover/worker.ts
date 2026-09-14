import type {
  ModelProgress,
  ModelVariant,
  SupportedModelId,
  RuntimeDevice,
} from './types';

// Cache loaded pipelines in worker thread
const pipelineCache: Record<string, any> = {};

let activePipeline: any = null;
let currentModelVariant: ModelVariant | null = null;
let currentDevice: RuntimeDevice | null = null;
let isAborted = false;

self.onmessage = async (e: MessageEvent) => {
  const { type, id, payload } = e.data;

  if (type === 'abort') {
    isAborted = true;
    return;
  }

  if (type === 'loadModel') {
    try {
      isAborted = false;
      const { variant = 'rmbg-1.4', forceDevice, hasWebGpu } = payload;
      const res = await loadModelInWorker(variant, forceDevice, hasWebGpu, (progress) => {
        if (!isAborted) {
          self.postMessage({ type: 'progress', id, payload: progress });
        }
      });
      self.postMessage({ type: 'modelLoaded', id, payload: res });
    } catch (err: any) {
      self.postMessage({
        type: 'error',
        id,
        payload: { message: err?.message || 'Gagal memuat model di worker.' },
      });
    }
    return;
  }

  if (type === 'processImage') {
    try {
      isAborted = false;
      const { imageBlob, options, hasWebGpu } = payload;
      const startTime = performance.now();

      const variant: ModelVariant = options?.modelVariant || 'rmbg-1.4';
      const forceDevice: RuntimeDevice | undefined = options?.forceDevice;

      // 1. Ensure model is loaded
      const { pipeline: segmenter, runtime: runtimeUsed, modelName } =
        await loadModelInWorker(variant, forceDevice, hasWebGpu, (prog) => {
          if (!isAborted) {
            self.postMessage({ type: 'progress', id, payload: prog });
          }
        });

      if (isAborted) {
        throw new Error('Proses dibatalkan.');
      }

      self.postMessage({
        type: 'progress',
        id,
        payload: {
          status: 'processing',
          stage: 'removing-bg',
          progress: 50,
          message: 'Menghapus latar belakang...',
          runtime: runtimeUsed,
          webgpuAvailable: runtimeUsed === 'webgpu',
        },
      });

      // 2. Create object URL for inference inside worker
      const blobUrl = URL.createObjectURL(imageBlob);

      let output: any;
      try {
        output = await segmenter(blobUrl);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }

      if (isAborted) {
        throw new Error('Proses dibatalkan.');
      }

      self.postMessage({
        type: 'progress',
        id,
        payload: {
          status: 'processing',
          stage: 'finalizing',
          progress: 90,
          message: 'Menyusun hasil akhir...',
          runtime: runtimeUsed,
          webgpuAvailable: runtimeUsed === 'webgpu',
        },
      });

      // 3. Extract mask data
      let maskData: Uint8ClampedArray;
      let maskWidth = 0;
      let maskHeight = 0;

      if (output && output.data && output.width && output.height) {
        maskWidth = output.width;
        maskHeight = output.height;
        maskData = new Uint8ClampedArray(maskWidth * maskHeight);

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
        maskWidth = maskRaw.width;
        maskHeight = maskRaw.height;
        maskData = new Uint8ClampedArray(maskRaw.data);
      } else {
        throw new Error('Format output model tidak dikenal.');
      }

      const duration = Math.round(performance.now() - startTime);

      // Transfer maskData buffer back to main thread with 0 latency
      (self as any).postMessage(
        {
          type: 'processDone',
          id,
          payload: {
            maskData,
            maskWidth,
            maskHeight,
            duration,
            runtimeUsed,
            modelUsed: modelName,
          },
        },
        [maskData.buffer]
      );
    } catch (err: any) {
      self.postMessage({
        type: 'error',
        id,
        payload: { message: err?.message || 'Inferensi AI gagal.' },
      });
    }
  }
};

async function loadModelInWorker(
  variant: ModelVariant,
  forceDevice: RuntimeDevice | undefined,
  hasWebGpu: boolean,
  onProgress?: (progress: ModelProgress) => void
): Promise<{ pipeline: any; runtime: RuntimeDevice; modelName: string }> {
  const targetDevice: RuntimeDevice =
    forceDevice || (hasWebGpu ? 'webgpu' : 'wasm');

  const modelId: SupportedModelId =
    variant === 'birefnet'
      ? 'onnx-community/BiRefNet-ONNX'
      : 'briaai/RMBG-1.4';

  const cacheKey = `${modelId}:${targetDevice}`;

  if (pipelineCache[cacheKey]) {
    activePipeline = pipelineCache[cacheKey];
    currentModelVariant = variant;
    currentDevice = targetDevice;
    onProgress?.({
      status: 'loading',
      stage: 'using-cached-model',
      message: 'Menggunakan model dari cache',
      progress: 100,
      runtime: targetDevice,
      webgpuAvailable: hasWebGpu,
      isFirstTime: false,
    });
    return {
      pipeline: activePipeline,
      runtime: targetDevice,
      modelName: modelId,
    };
  }

  onProgress?.({
    status: 'downloading',
    stage: 'preparing-model',
    message: 'Mempersiapkan model AI...',
    progress: 0,
    runtime: targetDevice,
    webgpuAvailable: hasWebGpu,
    isFirstTime: true,
  });

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
    if (isAborted) return;
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
        message: 'Mendownload model...',
        runtime: targetDevice,
        webgpuAvailable: hasWebGpu,
        isFirstTime: true,
        detail: info.file ? `${info.file}` : undefined,
      });
    } else if (info.status === 'ready' || info.status === 'done') {
      onProgress?.({
        status: 'loading',
        stage: 'preparing-model',
        progress: 100,
        message: 'Model siap digunakan',
        runtime: targetDevice,
        webgpuAvailable: hasWebGpu,
        isFirstTime: true,
      });
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
      } catch (cfgErr) {
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
            isFirstTime: true,
          });
        }

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
      lastError?.message || 'Model AI gagal dipersiapkan di background worker.'
    );
  }

  pipelineCache[cacheKey] = segmenter;
  activePipeline = segmenter;
  currentModelVariant = variant;
  currentDevice = actualRuntime;

  return {
    pipeline: segmenter,
    runtime: actualRuntime,
    modelName: usedModelId,
  };
}
