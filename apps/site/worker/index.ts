import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface ImagesBinding {
  input(stream: ReadableStream): {
    transform(options: Record<string, unknown>): {
      output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
}

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS?: AssetFetcher;
  IMAGES?: ImagesBinding;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const imageOptimizationPaths = new Set(["/_next/image", "/_vinext/image"]);

function fetchSourceAsset(path: string, request: Request, assets?: AssetFetcher): Promise<Response> {
  const assetRequest = new Request(new URL(path, request.url));
  return assets ? assets.fetch(assetRequest) : fetch(assetRequest);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (!imageOptimizationPaths.has(url.pathname)) return handler.fetch(request, env, ctx);

    const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
    const fetchAsset = (path: string) => fetchSourceAsset(path, request, env.ASSETS);
    if (!env.IMAGES) return handleImageOptimization(request, { fetchAsset }, allowedWidths);

    return handleImageOptimization(request, {
      fetchAsset,
      transformImage: async (body, { width, format, quality }) => {
        const transformed = await env.IMAGES?.input(body)
          .transform(width > 0 ? { width } : {})
          .output({ format, quality });
        if (!transformed) throw new Error("O serviço de imagens ficou indisponível durante a transformação.");
        return transformed.response();
      },
    }, allowedWidths);
  },
};

export default worker;
