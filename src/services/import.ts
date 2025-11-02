import { supabase } from '../lib/supabase';
import { RawLinkedInProfile } from '../types/linkedin';

export class ImportService {
  async parseCSV(csvText: string): Promise<RawLinkedInProfile[]> {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file is empty');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const profiles: RawLinkedInProfile[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const profile = this.mapCSVRowToProfile(headers, values);
      if (profile) profiles.push(profile);
    }

    return profiles;
  }

  async parseJSON(jsonText: string): Promise<RawLinkedInProfile[]> {
    try {
      const data = JSON.parse(jsonText);
      const profiles = Array.isArray(data) ? data : [data];
      return profiles.filter(p => this.isValidProfile(p));
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  private mapCSVRowToProfile(
    headers: string[],
    values: string[]
  ): RawLinkedInProfile | null {
    const profileObj: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (values[index]) {
        profileObj[header] = values[index];
      }
    });

    if (!profileObj.linkedin_id || !profileObj.full_name || !profileObj.profile_url) {
      return null;
    }

    return {
      linkedin_id: String(profileObj.linkedin_id),
      full_name: String(profileObj.full_name),
      headline: profileObj.headline ? String(profileObj.headline) : '',
      location: profileObj.location ? String(profileObj.location) : '',
      summary: profileObj.summary ? String(profileObj.summary) : '',
      experience: profileObj.experience
        ? JSON.parse(String(profileObj.experience))
        : [],
      education: profileObj.education ? JSON.parse(String(profileObj.education)) : [],
      skills: profileObj.skills ? String(profileObj.skills).split(';') : [],
      connections_count: profileObj.connections_count
        ? parseInt(String(profileObj.connections_count))
        : 0,
      profile_url: String(profileObj.profile_url),
      profile_image_url: profileObj.profile_image_url
        ? String(profileObj.profile_image_url)
        : undefined,
      banner_image_url: profileObj.banner_image_url
        ? String(profileObj.banner_image_url)
        : undefined,
    };
  }

  private isValidProfile(obj: unknown): obj is RawLinkedInProfile {
    const p = obj as Record<string, unknown>;
    return (
      typeof p.linkedin_id === 'string' &&
      typeof p.full_name === 'string' &&
      typeof p.profile_url === 'string'
    );
  }

  async logImport(
    userId: string,
    importType: 'csv' | 'json' | 'api',
    fileName: string,
    totalRecords: number,
    successfulRecords: number,
    failedRecords: number
  ) {
    const { error } = await supabase.from('user_imports').insert({
      user_id: userId,
      import_type: importType,
      file_name: fileName,
      total_records: totalRecords,
      successful_records: successfulRecords,
      failed_records: failedRecords,
    });

    if (error) throw error;
  }

  async getUserImports(userId: string) {
    const { data, error } = await supabase
      .from('user_imports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
