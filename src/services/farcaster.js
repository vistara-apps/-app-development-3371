import axios from 'axios';

const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY || 'your-neynar-api-key';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

const neynarClient = axios.create({
  baseURL: NEYNAR_BASE_URL,
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json'
  }
});

// User Authentication & Profile
export async function getFarcasterUser(fid) {
  try {
    const response = await neynarClient.get(`/farcaster/user/bulk?fids=${fid}`);
    return response.data.users[0];
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    throw error;
  }
}

export async function getFarcasterUserByUsername(username) {
  try {
    const response = await neynarClient.get(`/farcaster/user/by_username?username=${username}`);
    return response.data.user;
  } catch (error) {
    console.error('Error fetching Farcaster user by username:', error);
    throw error;
  }
}

// Social Graph Data for Enhanced Personalization
export async function getUserFollowing(fid, limit = 100) {
  try {
    const response = await neynarClient.get(`/farcaster/following?fid=${fid}&limit=${limit}`);
    return response.data.users;
  } catch (error) {
    console.error('Error fetching user following:', error);
    throw error;
  }
}

export async function getUserFollowers(fid, limit = 100) {
  try {
    const response = await neynarClient.get(`/farcaster/followers?fid=${fid}&limit=${limit}`);
    return response.data.users;
  } catch (error) {
    console.error('Error fetching user followers:', error);
    throw error;
  }
}

// Cast Management for Sharing Recommendations
export async function publishCast(signerUuid, text, embeds = []) {
  try {
    const response = await neynarClient.post('/farcaster/cast', {
      signer_uuid: signerUuid,
      text: text,
      embeds: embeds
    });
    return response.data.cast;
  } catch (error) {
    console.error('Error publishing cast:', error);
    throw error;
  }
}

export async function getUserCasts(fid, limit = 25) {
  try {
    const response = await neynarClient.get(`/farcaster/casts?fid=${fid}&limit=${limit}`);
    return response.data.casts;
  } catch (error) {
    console.error('Error fetching user casts:', error);
    throw error;
  }
}

// Enhanced Personalization using Social Data
export async function getStyleInfluencers(userFid) {
  try {
    const following = await getUserFollowing(userFid, 50);
    
    // Filter for fashion/style related accounts
    const styleInfluencers = following.filter(user => {
      const bio = user.profile?.bio?.text?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      
      return bio.includes('fashion') || 
             bio.includes('style') || 
             bio.includes('sustainable') ||
             bio.includes('eco') ||
             username.includes('fashion') ||
             username.includes('style');
    });
    
    return styleInfluencers;
  } catch (error) {
    console.error('Error getting style influencers:', error);
    return [];
  }
}

// Share Recommendation as Cast
export async function shareRecommendation(signerUuid, recommendation, userProfile) {
  try {
    const castText = `🌱 Just discovered ${recommendation.brandName}'s ${recommendation.itemName}! 

${recommendation.ecoImpact} 

Perfect match for my ${userProfile.aesthetics} style. Check out @ecostyle-match for personalized sustainable fashion recommendations! 

#SustainableFashion #EcoStyle #Web3Fashion`;

    const embeds = [{
      url: `https://ecostyle-match.vercel.app?ref=farcaster&item=${encodeURIComponent(recommendation.itemName)}`
    }];

    return await publishCast(signerUuid, castText, embeds);
  } catch (error) {
    console.error('Error sharing recommendation:', error);
    throw error;
  }
}

// Get trending fashion topics from Farcaster
export async function getTrendingFashionCasts(limit = 20) {
  try {
    const response = await neynarClient.get(`/farcaster/feed/trending?limit=${limit}`);
    
    // Filter for fashion-related casts
    const fashionCasts = response.data.casts.filter(cast => {
      const text = cast.text?.toLowerCase() || '';
      return text.includes('fashion') || 
             text.includes('style') || 
             text.includes('sustainable') ||
             text.includes('eco') ||
             text.includes('outfit');
    });
    
    return fashionCasts;
  } catch (error) {
    console.error('Error fetching trending fashion casts:', error);
    return [];
  }
}

// Validate Farcaster Frame signature (for frame interactions)
export async function validateFrameSignature(frameSignaturePacket) {
  try {
    const response = await neynarClient.post('/farcaster/frame/validate', {
      message_bytes_in_hex: frameSignaturePacket
    });
    return response.data;
  } catch (error) {
    console.error('Error validating frame signature:', error);
    throw error;
  }
}

// Get user's connected addresses for wallet integration
export async function getUserConnectedAddresses(fid) {
  try {
    const response = await neynarClient.get(`/farcaster/user/bulk?fids=${fid}`);
    const user = response.data.users[0];
    return user?.verified_addresses || [];
  } catch (error) {
    console.error('Error fetching user connected addresses:', error);
    return [];
  }
}

// Utility function to extract FID from Farcaster URL or username
export function extractFidFromInput(input) {
  // Handle different input formats
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    // Extract from URL like https://warpcast.com/username
    const urlMatch = input.match(/warpcast\.com\/([^\/]+)/);
    if (urlMatch) return urlMatch[1];
    
    // Remove @ if present
    return input.replace('@', '');
  }
  return null;
}

// Enhanced user identification for the app
export async function identifyFarcasterUser(walletAddress) {
  try {
    // Search for users with this verified address
    const response = await neynarClient.get(`/farcaster/user/by_verification?address=${walletAddress}`);
    return response.data.user;
  } catch (error) {
    console.error('Error identifying Farcaster user by wallet:', error);
    return null;
  }
}
