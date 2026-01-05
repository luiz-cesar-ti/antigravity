
/**
 * Generates a SHA-256 hash (fingerprint) of a given text string.
 * This is used for digital signatures and audit trails.
 */
export async function generateHash(text: string): Promise<string> {
    // Normalização rigorosa: remove espaços em branco extras e normaliza quebras de linha
    const normalizedText = text.trim().replace(/\r\n/g, '\n');
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
