import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User Profile Management
export async function saveUserProfile(userId, stylePreferences) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        style_preferences: stylePreferences,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Recommendations Management
export async function saveRecommendation(userId, recommendation) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        user_id: userId,
        brand_name: recommendation.brandName,
        item_name: recommendation.itemName,
        description: recommendation.description,
        eco_impact_summary: recommendation.ecoImpact,
        style_match: recommendation.styleMatch,
        estimated_price: recommendation.estimatedPrice,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving recommendation:', error);
    throw error;
  }
}

export async function getUserRecommendations(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user recommendations:', error);
    throw error;
  }
}

// Payment Tracking
export async function logPayment(userId, amount, paymentMethod = 'wallet') {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        payment_method: paymentMethod,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error logging payment:', error);
    throw error;
  }
}

export async function getUserPayments(userId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
}

// Analytics
export async function getUserStats(userId) {
  try {
    const [profileData, recommendationsData, paymentsData] = await Promise.all([
      getUserProfile(userId),
      getUserRecommendations(userId),
      getUserPayments(userId)
    ]);

    const uniqueBrands = new Set(recommendationsData?.map(r => r.brand_name) || []).size;
    const totalSpent = paymentsData?.reduce((sum, p) => sum + parseFloat(p.amount.replace('$', '')), 0) || 0;

    return {
      profile: profileData,
      totalRecommendations: recommendationsData?.length || 0,
      uniqueBrands,
      totalSpent: `$${totalSpent.toFixed(2)}`,
      joinedAt: profileData?.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

// Database Schema Creation (for reference)
export const createTables = async () => {
  // This would typically be run as SQL migrations
  const schemas = {
    user_profiles: `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        style_preferences JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    recommendations: `
      CREATE TABLE IF NOT EXISTS recommendations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        brand_name TEXT NOT NULL,
        item_name TEXT NOT NULL,
        description TEXT,
        eco_impact_summary TEXT,
        style_match TEXT,
        estimated_price TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
      );
    `,
    payments: `
      CREATE TABLE IF NOT EXISTS payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount TEXT NOT NULL,
        payment_method TEXT DEFAULT 'wallet',
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
      );
    `
  };
  
  return schemas;
};
