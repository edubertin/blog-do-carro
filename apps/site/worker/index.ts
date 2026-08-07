import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  ADMIN_AUTHORIZED_HEADER,
  LOCAL_PREVIEW_HEADER,
} from "../app/admin/admin-auth-core";
import { adminGateResponse, isLocalPreviewUrl, isProtectedAdminPath } from "./admin-access";
import type { AdminAuthEnvironment } from "./admin-access";

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

interface Env extends AdminAuthEnvironment {
  ASSETS?: AssetFetcher;
  IMAGES?: ImagesBinding;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const imageOptimizationPaths = new Set(["/_next/image", "/_vinext/image"]);

function hardenAdminResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function requestIdFor(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  if (supplied && /^[A-Za-z0-9._-]{8,80}$/.test(supplied)) return supplied;
  return crypto.randomUUID();
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-Id", requestId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function reportFailure(error: unknown, requestId: string, route: string): void {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({ event: "request.failed", errorName, requestId, route }));
}

function internalErrorResponse(requestId: string): Response {
  const response = new Response("Internal Server Error", {
    status: 500,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
  return withRequestId(response, requestId);
}

function fetchSourceAsset(path: string, request: Request, assets?: AssetFetcher): Promise<Response> {
  const assetRequest = new Request(new URL(path, request.url));
  return assets ? assets.fetch(assetRequest) : fetch(assetRequest);
}

function adminHandlerRequest(request: Request, url: URL): Request {
  const headers = new Headers(request.headers);
  headers.delete(LOCAL_PREVIEW_HEADER);
  headers.delete(ADMIN_AUTHORIZED_HEADER);
  headers.set(ADMIN_AUTHORIZED_HEADER, "owner");
  if (isLocalPreviewUrl(url)) headers.set(LOCAL_PREVIEW_HEADER, "1");
  if (request.method === "GET" || request.method === "HEAD") {
    return new Request(request.url, { method: request.method, headers, redirect: request.redirect });
  }
  return new Request(request, { headers });
}

const worker = {
  async fetch(request: Request, env: Env | undefined, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestId = requestIdFor(request);
    try {
      const response = await handleRequest(request, env ?? {}, ctx, url);
      return withRequestId(response, requestId);
    } catch (error) {
      reportFailure(error, requestId, routeClass(url.pathname));
      return internalErrorResponse(requestId);
    }
  },
};

function routeClass(pathname: string): string {
  if (isProtectedAdminPath(pathname)) return "admin";
  return imageOptimizationPaths.has(pathname) ? "image" : "public";
}

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
): Promise<Response> {
  if (isProtectedAdminPath(url.pathname)) {
    const denied = adminGateResponse(request, env, url);
    if (denied) return hardenAdminResponse(denied);
    return hardenAdminResponse(await handler.fetch(adminHandlerRequest(request, url), env, ctx));
  }
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
}

export default worker;
