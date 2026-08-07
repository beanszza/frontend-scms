export function getImageUrl(path: string | null | undefined): string {
  if (!path || !path.trim()) return "";
  const trimmed = path.trim();

  // 1. Return Base64 data URLs or absolute HTTP/HTTPS URLs as-is
  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("data:application/pdf") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  // 2. Normalize relative paths
  let cleanPath = trimmed;
  if (cleanPath.startsWith("/api/scms")) {
    cleanPath = cleanPath.replace("/api/scms", "");
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  const backendHost = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/$/, "");
  return `${backendHost}${cleanPath}`;
}
