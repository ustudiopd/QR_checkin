export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * QR 체크인 요청
 * @param {string} qrCode
 * @returns {Promise<{status: string, name: string}>}
 */
export async function checkAttendance(qrCode) {
  const res = await fetch(`${BACKEND_URL}/attendance/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_code: qrCode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Unknown error');
  }
  return res.json();
}