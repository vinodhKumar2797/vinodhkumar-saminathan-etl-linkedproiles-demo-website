import { supabase } from '../lib/supabase';
import { RawLinkedInProfile } from '../types/linkedin';

export class APIService {
  async fetchLinkedInProfile(profileUrl: string): Promise<RawLinkedInProfile> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-linkedin-profile`;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ profileUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  }

  async fetchMultipleProfiles(
    profileUrls: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<RawLinkedInProfile[]> {
    const results: RawLinkedInProfile[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (let i = 0; i < profileUrls.length; i++) {
      try {
        const profile = await this.fetchLinkedInProfile(profileUrls[i]);
        results.push(profile);
        onProgress?.(i + 1, profileUrls.length);

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors.push({
          url: profileUrls[i],
          error: (error as Error).message,
        });
        onProgress?.(i + 1, profileUrls.length);
      }
    }

    if (errors.length > 0) {
      console.warn('Some profiles failed to fetch:', errors);
    }

    return results;
  }
}
