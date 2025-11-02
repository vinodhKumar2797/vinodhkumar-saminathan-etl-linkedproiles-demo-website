import { RawLinkedInProfile } from '../types/linkedin';

export class HashService {
  async generateProfileHash(profile: RawLinkedInProfile): Promise<string> {
    const normalizedData = {
      full_name: profile.full_name,
      headline: profile.headline || '',
      location: profile.location || '',
      summary: profile.summary || '',
      experience: profile.experience || [],
      education: profile.education || [],
      skills: profile.skills || [],
      connections_count: profile.connections_count || 0,
    };

    const dataString = JSON.stringify(normalizedData);
    return await this.sha256(dataString);
  }

  async generateImageHash(imageUrl: string): Promise<string> {
    return await this.sha256(imageUrl);
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
