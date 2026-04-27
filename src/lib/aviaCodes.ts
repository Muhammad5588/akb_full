export const AVIA_CODES: Record<string, string> = {
  bektemir: 'A01-', chilonzor: 'A02-', yakkasaroy: 'A03-', mirobod: 'A04-',
  mirzo_ulugbek: 'A05-', olmazor: 'A06-', sergeli: 'A07-', shayxontohur: 'A08-',
  uchtepa: 'A09-', yunusobod: 'A10-', yashnobod: 'A11-', yangihayot: 'A12-'
};

export const REGION_PREFIXES: Record<string, string> = {
  toshkent_city: 'A0', // Faqat tipni aldash uchun, pastdagi mantiq o'zi ushlaydi
  toshkent: 'ATV',
  sirdarya: 'ASR',
  jizzakh: 'AJZ',
  samarkand: 'ASM',
  fergana: 'AFR',
  namangan: 'ANM',
  andijan: 'AAJ',
  kashkadarya: 'AQD',
  surkhandarya: 'ASD',
  bukhara: 'ABX',
  navoi: 'ANV',
  khorezm: 'AXR',
  karakalpakstan: 'AQR',
};

// Helper function to find region and district from a client code prefix
export const getRegionAndDistrictFromCode = (code: string): { region: string | null, district: string | null } => {
  const upperCode = code.toUpperCase();
  
  // Find district by exact matching prefix for Tashkent
  for (const [districtKey, districtCode] of Object.entries(AVIA_CODES)) {
    if (upperCode.startsWith(districtCode)) {
      return { region: 'toshkent_city', district: districtKey };
    }
  }

  // If no district matched, try region match
  for (const [regionKey, rCode] of Object.entries(REGION_PREFIXES)) {
    if (upperCode.startsWith(rCode)) {
      return { region: regionKey, district: null };
    }
  }

  return { region: null, district: null };
};
