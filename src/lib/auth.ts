import { supabase } from './supabase';

export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Record<string, unknown>) {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
