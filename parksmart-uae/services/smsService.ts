
import { City, Vehicle } from '../types';

export function formatParkingSMS(city: City, zone: string, duration: number, vehicle: Vehicle): { number: string; body: string } {
  let number = '';
  let body = '';

  // Standard durations in UAE SMS are usually in hours for the command
  const hours = Math.ceil(duration / 60);

  if (city === City.DUBAI) {
    number = '7275'; // RTA Dubai
    // Format: [Plate] [Zone] [Duration]
    body = `${vehicle.plate} ${zone} ${hours}`;
  } else if (city === City.ABU_DHABI) {
    number = '3009'; // Mawaqif Abu Dhabi
    // Format: [PlateCode][PlateNumber] [Zone] [Duration]
    // Mawaqif uses S for standard, P for premium usually handled by zone input
    body = `${vehicle.code}${vehicle.plate} ${zone} ${hours}`;
  } else {
    // Default to Dubai format as it's most common for other emirates too
    number = '7275';
    body = `${vehicle.plate} ${zone} ${hours}`;
  }

  return { number, body };
}

export function triggerSMS(city: City, zone: string, duration: number, vehicle: Vehicle) {
  const { number, body } = formatParkingSMS(city, zone, duration, vehicle);
  const smsUrl = `sms:${number}?body=${encodeURIComponent(body)}`;
  window.location.href = smsUrl;
}
