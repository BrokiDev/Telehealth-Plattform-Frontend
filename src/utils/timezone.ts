/**
 * Timezone utilities for handling dates in America/Santo_Domingo (GMT-4)
 */

const TIMEZONE = 'America/Santo_Domingo';

/**
 * Get current date/time in Santo Domingo timezone
 */
export function getCurrentDateTimeInTimezone(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Convert a local datetime-local input value to ISO string with proper timezone
 * @param datetimeLocalValue - Value from input[type="datetime-local"] e.g., "2024-01-15T14:30"
 * @returns ISO string that represents that time in Santo Domingo timezone (GMT-4)
 */
export function datetimeLocalToISO(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) return '';
  
  // Parse the datetime-local value
  // The user sees and inputs time in Santo Domingo time (GMT-4)
  // datetime-local format: "2024-01-15T14:30"
  
  // Append GMT-4 offset to create a proper ISO string
  // GMT-4 = -04:00
  const isoStringWithOffset = `${datetimeLocalValue}:00-04:00`;
  
  // Parse and convert to UTC
  const date = new Date(isoStringWithOffset);
  
  return date.toISOString();
}

/**
 * Convert ISO string to datetime-local input value in Santo Domingo timezone
 * @param isoString - ISO date string from backend
 * @returns Value for input[type="datetime-local"] e.g., "2024-01-15T14:30"
 */
export function isoToDatetimeLocal(isoString: string): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  // Get the date/time parts in Santo Domingo timezone using Intl
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = getValue('hour');
  const minute = getValue('minute');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Format date for display in Santo Domingo timezone
 */
export function formatDateTime(isoString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    ...options,
  });
}

/**
 * Format date only (no time) in Santo Domingo timezone
 */
export function formatDate(isoString: string): string {
  return formatDateTime(isoString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time only (no date) in Santo Domingo timezone
 */
export function formatTime(isoString: string): string {
  return formatDateTime(isoString, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get today's date in YYYY-MM-DD format (Santo Domingo timezone)
 */
export function getTodayDateString(): string {
  const now = getCurrentDateTimeInTimezone();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format (Santo Domingo timezone)
 * Rounded to next 15-minute interval
 */
export function getCurrentTimeString(): string {
  const now = getCurrentDateTimeInTimezone();
  
  // Round up to next 15-minute interval
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(minutes, 0, 0);
  
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  
  return `${hours}:${mins}`;
}

/**
 * Calculate end time based on start time and duration
 * @param startDatetimeLocal - datetime-local format string
 * @param durationMinutes - duration in minutes
 * @returns datetime-local format string for end time
 */
export function calculateEndTime(startDatetimeLocal: string, durationMinutes: number): string {
  if (!startDatetimeLocal) return '';
  
  // Parse the datetime-local value
  const [datePart, timePart] = startDatetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date and add duration
  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
  
  // Format back to datetime-local
  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endHours = String(endDate.getHours()).padStart(2, '0');
  const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
  
  return `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
}
