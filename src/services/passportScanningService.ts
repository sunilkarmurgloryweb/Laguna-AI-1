interface PassportData {
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  issueDate: string;
  placeOfBirth?: string;
  sex?: string;
  photo?: string;
}

interface ScanResult {
  success: boolean;
  data?: PassportData;
  confidence: number;
  errors: string[];
}

class PassportScanningService {
  private static instance: PassportScanningService;

  public static getInstance(): PassportScanningService {
    if (!PassportScanningService.instance) {
      PassportScanningService.instance = new PassportScanningService();
    }
    return PassportScanningService.instance;
  }

  // Simulate OCR scanning of passport
  public async scanPassport(imageData: string): Promise<ScanResult> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

      // Mock passport data extraction
      const mockData: PassportData = {
        name: 'SMITH, JOHN MICHAEL',
        passportNumber: 'P' + Math.random().toString().substr(2, 8),
        nationality: 'USA',
        dateOfBirth: '1985-03-15',
        expiryDate: '2030-03-15',
        issueDate: '2020-03-15',
        placeOfBirth: 'NEW YORK, USA',
        sex: 'M',
        photo: imageData
      };

      // Simulate confidence based on image quality
      const confidence = 0.85 + Math.random() * 0.15;

      // Validate extracted data
      const validation = this.validatePassportData(mockData);

      return {
        success: validation.isValid,
        data: validation.isValid ? mockData : undefined,
        confidence,
        errors: validation.errors
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown scanning error']
      };
    }
  }

  // Validate passport data
  private validatePassportData(data: PassportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!data.name || data.name.length < 2) {
      errors.push('Invalid or missing name');
    }

    if (!data.passportNumber || !/^[A-Z0-9]{6,9}$/.test(data.passportNumber)) {
      errors.push('Invalid passport number format');
    }

    if (!data.nationality || data.nationality.length < 2) {
      errors.push('Invalid or missing nationality');
    }

    // Validate dates
    const birthDate = new Date(data.dateOfBirth);
    const expiryDate = new Date(data.expiryDate);
    const issueDate = new Date(data.issueDate);
    const now = new Date();

    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid date of birth');
    } else if (birthDate > now) {
      errors.push('Date of birth cannot be in the future');
    }

    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid expiry date');
    } else if (expiryDate <= now) {
      errors.push('Passport has expired');
    }

    if (isNaN(issueDate.getTime())) {
      errors.push('Invalid issue date');
    } else if (issueDate > now) {
      errors.push('Issue date cannot be in the future');
    }

    // Check age constraints
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 120) {
      errors.push('Invalid age calculated from date of birth');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Extract text from image using OCR (mock implementation)
  public async extractTextFromImage(imageData: string): Promise<string[]> {
    // In a real implementation, this would use OCR libraries like Tesseract.js
    // For now, return mock extracted text
    return [
      'PASSPORT',
      'UNITED STATES OF AMERICA',
      'SMITH, JOHN MICHAEL',
      'P123456789',
      'USA',
      '15 MAR 1985',
      '15 MAR 2030',
      'M',
      'NEW YORK, USA'
    ];
  }

  // Check if passport is from a supported country
  public isSupportedCountry(nationality: string): boolean {
    const supportedCountries = [
      'USA', 'CAN', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'JPN', 'KOR', 'AUS',
      'NZL', 'NLD', 'BEL', 'CHE', 'AUT', 'SWE', 'NOR', 'DNK', 'FIN', 'IRL'
    ];
    
    return supportedCountries.includes(nationality.toUpperCase());
  }

  // Get passport validation requirements by country
  public getValidationRequirements(nationality: string): {
    minimumValidityMonths: number;
    requiresVisa: boolean;
    additionalDocuments: string[];
  } {
    const requirements: Record<string, any> = {
      'USA': { minimumValidityMonths: 6, requiresVisa: false, additionalDocuments: [] },
      'CAN': { minimumValidityMonths: 6, requiresVisa: false, additionalDocuments: [] },
      'GBR': { minimumValidityMonths: 6, requiresVisa: false, additionalDocuments: [] },
      'FRA': { minimumValidityMonths: 3, requiresVisa: false, additionalDocuments: [] },
      'DEU': { minimumValidityMonths: 3, requiresVisa: false, additionalDocuments: [] },
      'JPN': { minimumValidityMonths: 6, requiresVisa: false, additionalDocuments: [] },
      'default': { minimumValidityMonths: 6, requiresVisa: true, additionalDocuments: ['Visa'] }
    };

    return requirements[nationality.toUpperCase()] || requirements['default'];
  }

  // Format passport data for display
  public formatPassportData(data: PassportData): Record<string, string> {
    return {
      'Full Name': data.name,
      'Passport Number': data.passportNumber,
      'Nationality': data.nationality,
      'Date of Birth': new Date(data.dateOfBirth).toLocaleDateString(),
      'Expiry Date': new Date(data.expiryDate).toLocaleDateString(),
      'Issue Date': new Date(data.issueDate).toLocaleDateString(),
      'Place of Birth': data.placeOfBirth || 'Not specified',
      'Sex': data.sex || 'Not specified'
    };
  }

  // Check passport validity for hotel check-in
  public validateForCheckIn(data: PassportData): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    const expiryDate = new Date(data.expiryDate);
    const now = new Date();
    const monthsUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Check expiry
    if (expiryDate <= now) {
      errors.push('Passport has expired');
    } else if (monthsUntilExpiry < 6) {
      warnings.push('Passport expires within 6 months');
    }

    // Check if supported country
    if (!this.isSupportedCountry(data.nationality)) {
      warnings.push('Additional documentation may be required for this nationality');
    }

    // Check age for unaccompanied minors
    const birthDate = new Date(data.dateOfBirth);
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      warnings.push('Guest is a minor - additional documentation may be required');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}

export const passportScanningService = PassportScanningService.getInstance();
export type { PassportData, ScanResult };