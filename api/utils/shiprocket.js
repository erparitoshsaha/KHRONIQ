// api/utils/shiprocket.js
import 'dotenv/config';

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Obtain Shiprocket JWT Auth Token
 * Shiprocket JWT tokens are valid for 10 days.
 */
export async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL || 'Khroniqofficial@gmail.com';
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return {
      success: false,
      error: 'SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured in .env'
    };
  }

  // Return cached token if valid (re-fetch 2 days before 10-day expiration)
  const now = Date.now();
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return { success: true, token: cachedToken, fromCache: true };
  }

  const startTime = Date.now();
  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json();

    if (res.ok && data.token) {
      cachedToken = data.token;
      // Cache for 8 days
      tokenExpiresAt = now + 8 * 24 * 60 * 60 * 1000;
      return { success: true, token: cachedToken, latencyMs };
    }

    return {
      success: false,
      error: data.message || 'Shiprocket authentication failed',
      latencyMs
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      latencyMs: Date.now() - startTime
    };
  }
}

/**
 * Check live Shiprocket connection & latency
 */
export async function checkShiprocketHealth() {
  const startTime = Date.now();
  const auth = await getShiprocketToken();
  const latency = auth.latencyMs || (Date.now() - startTime);

  if (auth.success) {
    return {
      status: 'Active',
      latencyMs: latency,
      isLive: true,
      message: 'Live Shiprocket API connected'
    };
  }

  return {
    status: process.env.SHIPROCKET_PASSWORD ? 'Degraded' : 'Simulated',
    latencyMs: latency || 185,
    isLive: false,
    message: auth.error
  };
}

/**
 * Check live Shiprocket Serviceability by Delivery Pincode
 */
export async function checkShiprocketServiceability(deliveryPincode, pickupPincode = '110001', cod = 1, weight = 0.5) {
  const auth = await getShiprocketToken();
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  try {
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${encodeURIComponent(pickupPincode)}&delivery_postcode=${encodeURIComponent(deliveryPincode)}&weight=${weight}&cod=${cod}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'Serviceability check failed' };
    }

    const availableCouriers = data.data?.available_courier_companies || [];
    return {
      success: true,
      data: {
        recommendedCourierId: data.data?.recommended_courier_company_id,
        couriers: availableCouriers.map(c => ({
          id: c.courier_company_id,
          name: c.courier_name,
          rate: c.rate,
          estimatedDays: c.estimated_delivery_days,
          etd: c.etd,
          codAvailable: c.cod === 1,
          isRecommended: c.courier_company_id === data.data?.recommended_courier_company_id,
          rating: c.rating
        }))
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Track AWB live using Shiprocket
 */
export async function trackShiprocketAwb(awb) {
  const auth = await getShiprocketToken();
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  try {
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awb)}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'Tracking failed' };
    }

    return { success: true, tracking: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
