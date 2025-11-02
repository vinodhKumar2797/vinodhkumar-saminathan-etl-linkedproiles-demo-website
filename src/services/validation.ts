import { RawLinkedInProfile, ValidationError } from '../types/linkedin';

export class ProfileValidator {
  validate(profile: RawLinkedInProfile): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!profile.linkedin_id || profile.linkedin_id.trim() === '') {
      errors.push({
        field: 'linkedin_id',
        message: 'LinkedIn ID is required',
        severity: 'error'
      });
    }

    if (!profile.full_name || profile.full_name.trim() === '') {
      errors.push({
        field: 'full_name',
        message: 'Full name is required',
        severity: 'error'
      });
    }

    if (!profile.profile_url || !this.isValidUrl(profile.profile_url)) {
      errors.push({
        field: 'profile_url',
        message: 'Valid profile URL is required',
        severity: 'error'
      });
    }

    if (profile.headline && profile.headline.length > 220) {
      errors.push({
        field: 'headline',
        message: 'Headline exceeds maximum length of 220 characters',
        severity: 'warning'
      });
    }

    if (profile.summary && profile.summary.length > 2600) {
      errors.push({
        field: 'summary',
        message: 'Summary exceeds maximum length of 2600 characters',
        severity: 'warning'
      });
    }

    if (profile.connections_count !== undefined) {
      if (profile.connections_count < 0) {
        errors.push({
          field: 'connections_count',
          message: 'Connections count cannot be negative',
          severity: 'error'
        });
      } else if (profile.connections_count > 30000) {
        errors.push({
          field: 'connections_count',
          message: 'Connections count exceeds typical LinkedIn maximum',
          severity: 'warning'
        });
      }
    }

    if (profile.experience) {
      profile.experience.forEach((exp, index) => {
        if (!exp.company || exp.company.trim() === '') {
          errors.push({
            field: `experience[${index}].company`,
            message: 'Company name is required for experience entry',
            severity: 'warning'
          });
        }
        if (!exp.title || exp.title.trim() === '') {
          errors.push({
            field: `experience[${index}].title`,
            message: 'Job title is required for experience entry',
            severity: 'warning'
          });
        }
      });
    }

    if (profile.education) {
      profile.education.forEach((edu, index) => {
        if (!edu.school || edu.school.trim() === '') {
          errors.push({
            field: `education[${index}].school`,
            message: 'School name is required for education entry',
            severity: 'warning'
          });
        }
      });
    }

    return errors;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getValidationStatus(errors: ValidationError[]): 'valid' | 'invalid' {
    const hasErrors = errors.some(e => e.severity === 'error');
    return hasErrors ? 'invalid' : 'valid';
  }
}
