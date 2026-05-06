/**
 * Extracts latitude & longitude from a Google Maps URL or pasted text.
 * Supports: /@lat,lng  !3d…!4d…  ?q=lat,lng  &ll=lat,lng  or plain "lat, lng"
 */
export function parseLatLngFromGoogleMapsText(input) {
  if (input == null || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  const tight = s.replace(/\s/g, '');
  let m = tight.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (m) {
    const r = validatePair(m[1], m[2]);
    if (r) return r;
  }

  m = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|\s|\/|\?|#|z|\]|$)/);
  if (!m) m = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d+)/);
  if (m) {
    const r = validatePair(m[1], m[2]);
    if (r) return r;
  }

  m = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i);
  if (m) {
    const r = validatePair(m[1], m[2]);
    if (r) return r;
  }

  m = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)\b/);
  if (m) {
    const r = validatePair(m[1], m[2]);
    if (r) return r;
  }

  m = s.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)\b/);
  if (m) {
    const r = validatePair(m[1], m[2]);
    if (r) return r;
  }

  return null;
}

function validatePair(a, b) {
  const lat = parseFloat(a);
  const lng = parseFloat(b);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (Math.abs(lat) < 1e-9 && Math.abs(lng) < 1e-9) return null;
  return { latitude: lat, longitude: lng };
}
