// ============================================================
// MixMaven — Share Utilities
// ============================================================

const BASE_URL = 'https://mixmaven.io';

export function generateShareUrl(username: string, slug: string): string {
  return `${BASE_URL}/m/${username}/${slug}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

export async function nativeShare(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User cancelled or error
      return false;
    }
  }
  // Fallback to clipboard
  return copyToClipboard(url);
}
