// Signatures: PDF: 25504446, PNG: 89504E47, JPEG: FFD8FF, WEBP: 52494646
const SIGNATURES: Record<string, string[]> = {
  "application/pdf": ["25504446"],
  "image/png": ["89504E47"],
  "image/jpeg": ["FFD8FF", "FFD8FFE0", "FFD8FFE1"],
  "image/webp": ["52494646"],
};

/**
 * Confere o cabeçalho hexadecimal do arquivo contra a assinatura do tipo declarado.
 * Tipo sem assinatura conhecida é recusado (não há reserva permissiva).
 */
export function matchesMagicBytes(header: string, type: string): boolean {
  const signatures = SIGNATURES[type];
  if (!signatures) return false;

  return signatures.some(sig => header.startsWith(sig));
}
