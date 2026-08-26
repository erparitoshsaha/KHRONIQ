export function getExpectedDeliveryDate(zipCode) {
  if (!zipCode) return null;
  const cleaned = zipCode.trim();
  if (cleaned.length === 0) return null;

  let days = 5; // Default delivery days
  const firstDigit = cleaned.charAt(0);
  if (['1', '2'].includes(firstDigit)) {
    days = 3;
  } else if (['3', '4'].includes(firstDigit)) {
    days = 4;
  } else if (['5', '6'].includes(firstDigit)) {
    days = 5;
  } else if (['7', '8', '9'].includes(firstDigit)) {
    days = 6;
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + days);

  return deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
