const MANAGED_MEDIA_PATTERN = /^\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;

export function managedMediaAssetId(value: string): string | null {
  return value.match(MANAGED_MEDIA_PATTERN)?.[1] ?? null;
}

export function isManagedMediaPath(value: string): boolean {
  return managedMediaAssetId(value) !== null;
}
