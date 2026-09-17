export function parseUserAgent(ua = '') {
  const uaString = String(ua || '');
  
  // OS Detection
  let os = 'Other';
  if (/Windows NT/i.test(uaString)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(uaString) && !/iPhone|iPad|iPod/i.test(uaString)) os = 'macOS';
  else if (/Android/i.test(uaString)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(uaString)) os = 'iOS';
  else if (/Linux/i.test(uaString) && !/Android/i.test(uaString)) os = 'Linux';

  // Browser Detection
  let browser = 'Other';
  if (/Edg\//i.test(uaString)) browser = 'Edge';
  else if (/Chrome|CriOS/i.test(uaString) && !/Edg\//i.test(uaString) && !/OPR|Opera/i.test(uaString)) browser = 'Chrome';
  else if (/Firefox|FxiOS/i.test(uaString)) browser = 'Firefox';
  else if (/Safari/i.test(uaString) && !/Chrome|CriOS|Edg\/|OPR|Opera/i.test(uaString)) browser = 'Safari';
  else if (/OPR|Opera/i.test(uaString)) browser = 'Opera';

  // Device Type Detection
  let deviceType = 'Desktop';
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(uaString)) {
    deviceType = 'Tablet';
  } else if (/Mobile|iPhone|Android.*Mobile|webOS|BlackBerry|IEMobile/i.test(uaString)) {
    deviceType = 'Mobile';
  } else if (os === 'Windows' || os === 'macOS' || os === 'Linux') {
    deviceType = 'Desktop';
  }

  return { deviceType, browser, os };
}

export function extractClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  let ip = forwarded ? String(forwarded).split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || '127.0.0.1');

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  } else if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

export function getCoarseLocation(ip) {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return 'India / approximate location';
  }
  return 'India / approximate location';
}
