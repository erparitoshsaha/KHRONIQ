/**
 * Khroniq Delivery Estimation Service
 * Origin Warehouse Pincode: 201010 (Ghaziabad / Kaushambi, Delhi-NCR Logistics Hub)
 */

export const WAREHOUSE_ORIGIN_PINCODE = '201010';

export function calculateDeliveryEstimate(destPincode, originPincode = WAREHOUSE_ORIGIN_PINCODE) {
  if (!destPincode) {
    return { isValid: false, error: 'Please enter your 6-digit PIN code.' };
  }

  const cleaned = String(destPincode).replace(/\s+/g, '').trim();

  // Validate Indian PIN code (6 digits, does not start with 0)
  if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid 6-digit Indian PIN code (e.g. 110001, 201010, 400001).'
    };
  }

  let minDays = 3;
  let maxDays = 5;
  let zone = 'National Express';

  const prefix2 = cleaned.substring(0, 2);
  const prefix3 = cleaned.substring(0, 3);

  if (cleaned === originPincode) {
    // Exact Origin Warehouse Pincode
    minDays = 1;
    maxDays = 1;
    zone = 'Local Hub (Ghaziabad / Kaushambi)';
  } else if (
    ['201', '110', '121', '122', '120'].includes(prefix3) ||
    ['203', '245', '250'].includes(prefix3)
  ) {
    // Delhi-NCR Local Zone (Ghaziabad, Noida, Delhi, Gurgaon, Faridabad, Meerut)
    minDays = 1;
    maxDays = 2;
    zone = 'Delhi-NCR Express';
  } else if (
    // North Zone (UP, UK, HR, PB, RJ, HP, CH)
    ['12', '13', '14', '15', '16', '17', '20', '21', '22', '23', '24', '25', '26', '27', '28', '30', '31', '32', '33', '34'].includes(prefix2)
  ) {
    minDays = 2;
    maxDays = 3;
    zone = 'North Zone Regional';
  } else if (
    // Key Metros (Mumbai 400, Pune 411, Bangalore 560, Hyderabad 500, Chennai 600, Kolkata 700, Ahmedabad 380)
    ['400', '411', '560', '500', '600', '700', '380'].includes(prefix3)
  ) {
    minDays = 2;
    maxDays = 3;
    zone = 'Metro Air Express';
  } else if (
    // Remote / Special Terrains (J&K, Ladakh, North-East, Islands)
    ['18', '19', '78', '79'].includes(prefix2) ||
    ['744', '682'].includes(prefix3)
  ) {
    minDays = 4;
    maxDays = 6;
    zone = 'Special Logistics Zone';
  } else {
    // Rest of India (Tier 2/3 South, West, Central, East)
    minDays = 3;
    maxDays = 4;
    zone = 'National Air & Surface Express';
  }

  // Calculate actual business dates (skipping Sundays for delivery calculation)
  const addBusinessDays = (startDate, numDays) => {
    let count = 0;
    const date = new Date(startDate);
    while (count < numDays) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0) {
        count++;
      }
    }
    return date;
  };

  const today = new Date();
  const minDate = addBusinessDays(today, minDays);
  const maxDate = addBusinessDays(today, maxDays);

  const formatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const minDateStr = minDate.toLocaleDateString('en-IN', formatOptions);
  const maxDateStr = maxDate.toLocaleDateString('en-IN', formatOptions);

  const dateRangeText = minDays === maxDays 
    ? minDateStr 
    : `${minDateStr} – ${maxDateStr}`;

  const daysText = minDays === maxDays 
    ? `${minDays} Business Day` 
    : `${minDays}–${maxDays} Business Days`;

  return {
    isValid: true,
    pincode: cleaned,
    originPincode,
    minDays,
    maxDays,
    daysText,
    dateRangeText,
    minDateStr,
    maxDateStr,
    zone,
    courier: 'Blue Dart / Delhivery Express',
    freeShipping: true,
    codAvailable: true
  };
}

export function getExpectedDeliveryDate(zipCode) {
  const result = calculateDeliveryEstimate(zipCode);
  if (!result.isValid) return null;
  return result.dateRangeText;
}

