# EcoStyle Match API Documentation

This document provides comprehensive API documentation for the EcoStyle Match application, covering all integrations and services.

## Table of Contents
- [OpenAI Integration](#openai-integration)
- [Supabase Database API](#supabase-database-api)
- [Farcaster/Neynar API](#farcasterneynar-api)
- [Payment API](#payment-api)
- [Business Logic API](#business-logic-api)

## OpenAI Integration

### Overview
The OpenAI service generates personalized fashion recommendations using AI models via OpenRouter.

### Configuration
```javascript
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
});
```

### Methods

#### `generateRecommendations(styleProfile)`
Generates AI-powered fashion recommendations based on user style preferences.

**Parameters:**
- `styleProfile` (Object): User's style preferences
  - `brands` (string): Preferred brands
  - `fits` (string): Preferred fits
  - `aesthetics` (string): Style aesthetics
  - `colors` (string): Color preferences

**Returns:**
```javascript
[
  {
    brandName: "Patagonia",
    itemName: "Organic Cotton T-Shirt",
    description: "Classic fit tee made from 100% organic cotton",
    ecoImpact: "Saves 2,500L water vs conventional cotton",
    styleMatch: "Matches your minimalist style preference",
    estimatedPrice: "$35"
  }
]
```

**Example:**
```javascript
const recommendations = await generateRecommendations({
  brands: "Patagonia, Everlane",
  fits: "relaxed, oversized",
  aesthetics: "minimalist, sustainable",
  colors: "earth tones, neutrals"
});
```

---

## Supabase Database API

### Overview
Supabase handles data persistence for user profiles, recommendations, and payments.

### Database Schema

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  style_preferences JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Recommendations Table
```sql
CREATE TABLE recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  eco_impact_summary TEXT,
  style_match TEXT,
  estimated_price TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  payment_method TEXT DEFAULT 'wallet',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Methods

#### User Profile Management

##### `saveUserProfile(userId, stylePreferences)`
Saves or updates a user's style profile.

**Parameters:**
- `userId` (string): Unique user identifier
- `stylePreferences` (Object): User's style preferences

**Returns:** Profile object with ID and timestamps

##### `getUserProfile(userId)`
Retrieves a user's style profile.

**Parameters:**
- `userId` (string): Unique user identifier

**Returns:** Profile object or null if not found

#### Recommendations Management

##### `saveRecommendation(userId, recommendation)`
Saves a recommendation to the database.

**Parameters:**
- `userId` (string): User identifier
- `recommendation` (Object): Recommendation data

##### `getUserRecommendations(userId, limit = 50)`
Retrieves user's recommendation history.

**Parameters:**
- `userId` (string): User identifier
- `limit` (number): Maximum number of recommendations to return

#### Payment Tracking

##### `logPayment(userId, amount, paymentMethod = 'wallet')`
Logs a payment transaction.

**Parameters:**
- `userId` (string): User identifier
- `amount` (string): Payment amount (e.g., "$0.50")
- `paymentMethod` (string): Payment method used

##### `getUserPayments(userId)`
Retrieves user's payment history.

#### Analytics

##### `getUserStats(userId)`
Retrieves comprehensive user statistics.

**Returns:**
```javascript
{
  profile: { /* user profile data */ },
  totalRecommendations: 15,
  uniqueBrands: 8,
  totalSpent: "$7.50",
  joinedAt: "2024-01-15T10:30:00Z"
}
```

---

## Farcaster/Neynar API

### Overview
Farcaster integration provides social features and enhanced personalization through the Neynar API.

### Configuration
```javascript
const neynarClient = axios.create({
  baseURL: 'https://api.neynar.com/v2',
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

### Methods

#### User Authentication & Profile

##### `getFarcasterUser(fid)`
Retrieves Farcaster user information by FID.

**Parameters:**
- `fid` (number): Farcaster ID

**Returns:** User object with profile information

##### `getFarcasterUserByUsername(username)`
Retrieves Farcaster user by username.

**Parameters:**
- `username` (string): Farcaster username

##### `identifyFarcasterUser(walletAddress)`
Identifies Farcaster user by connected wallet address.

**Parameters:**
- `walletAddress` (string): Ethereum wallet address

#### Social Graph

##### `getUserFollowing(fid, limit = 100)`
Gets users that the specified user follows.

##### `getUserFollowers(fid, limit = 100)`
Gets followers of the specified user.

##### `getStyleInfluencers(userFid)`
Identifies fashion/style influencers in user's network.

**Returns:** Array of users with fashion-related content

#### Cast Management

##### `publishCast(signerUuid, text, embeds = [])`
Publishes a cast to Farcaster.

**Parameters:**
- `signerUuid` (string): Signer UUID for authentication
- `text` (string): Cast content
- `embeds` (Array): Optional embeds (links, images)

##### `shareRecommendation(signerUuid, recommendation, userProfile)`
Shares a recommendation as a Farcaster cast.

**Example:**
```javascript
const cast = await shareRecommendation(
  signerUuid,
  {
    brandName: "Patagonia",
    itemName: "Organic Cotton T-Shirt",
    ecoImpact: "Saves 2,500L water vs conventional cotton"
  },
  { aesthetics: "minimalist" }
);
```

#### Trending Content

##### `getTrendingFashionCasts(limit = 20)`
Retrieves trending fashion-related casts.

**Returns:** Array of fashion-related casts

---

## Payment API

### Overview
Handles micro-transactions using x402-axios for Web3 payments.

### Configuration
```javascript
const baseClient = axios.create({
  baseURL: "https://payments.vistara.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

const apiClient = withPaymentInterceptor(baseClient, walletClient);
```

### Methods

#### `usePaymentContext()`
React hook for payment functionality.

**Returns:**
- `createSession()`: Function to initiate payment

#### Payment Flow
1. User requests additional recommendations
2. `createSession()` is called with amount
3. Payment is processed via connected wallet
4. Transaction is logged to Supabase
5. New recommendations are generated

**Example:**
```javascript
const { createSession } = usePaymentContext();

const handlePayment = async () => {
  try {
    const paymentResponse = await createSession();
    console.log('Payment successful:', paymentResponse);
    // Generate new recommendations
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

---

## Business Logic API

### Overview
Handles pricing, user tiers, analytics, and recommendation scoring.

### Pricing

#### `calculatePrice(recommendationCount, bundleType = null)`
Calculates pricing for recommendations.

**Parameters:**
- `recommendationCount` (number): Number of recommendations
- `bundleType` (string): Optional bundle type

**Returns:**
```javascript
{
  price: 2.50,
  type: 'pay-per-use',
  count: 5
}
```

#### `getBundleOptions()`
Returns available pricing bundles.

**Returns:**
```javascript
[
  {
    id: 'bundle_12',
    name: '12 Recommendations Bundle',
    price: 5.00,
    count: 12,
    originalPrice: 6.00,
    savings: 1.00,
    description: 'Great value for regular users',
    popular: true
  }
]
```

### User Management

#### `getUserTier(userStats)`
Determines user tier based on engagement.

**Parameters:**
- `userStats` (Object): User statistics

**Returns:**
```javascript
{
  tier: 'advanced',
  name: 'Sustainable Style Enthusiast',
  benefits: ['Style analytics', 'Brand insights', 'Monthly eco-report'],
  discount: 0.10
}
```

### Analytics

#### `calculateEngagementMetrics(userStats, recommendations)`
Calculates user engagement metrics.

**Returns:**
```javascript
{
  diversityScore: 75.5,
  engagementLevel: 'high',
  averageSpendPerRecommendation: '0.50',
  recommendationQuality: 82.3
}
```

#### `scoreRecommendation(recommendation, userProfile)`
Scores recommendation quality (0-100).

**Parameters:**
- `recommendation` (Object): Recommendation data
- `userProfile` (Object): User's style profile

**Returns:** Quality score (number)

### Personalization

#### `enhanceRecommendations(recommendations, userProfile, userStats)`
Enhances recommendations with personalization data.

**Returns:** Enhanced recommendations with quality scores, personalized reasons, and sustainability ratings.

### A/B Testing

#### `getExperimentVariant(userId, experimentName)`
Returns A/B test variant for user.

**Parameters:**
- `userId` (string): User identifier
- `experimentName` (string): Experiment name

**Available Experiments:**
- `pricing_display`: ['control', 'bundle_emphasis', 'savings_highlight']
- `recommendation_layout`: ['grid', 'list', 'carousel']
- `eco_impact_display`: ['detailed', 'simple', 'visual']

---

## Error Handling

All API methods include comprehensive error handling:

```javascript
try {
  const result = await apiMethod(params);
  return result;
} catch (error) {
  console.error('API Error:', error);
  // Fallback behavior or user notification
  throw error;
}
```

### Common Error Codes
- `PGRST116`: No rows returned (Supabase)
- `401`: Unauthorized (API keys)
- `429`: Rate limit exceeded
- `500`: Internal server error

---

## Rate Limits

### OpenAI/OpenRouter
- 60 requests per minute
- 1000 requests per day (varies by plan)

### Neynar API
- 100 requests per minute
- 10,000 requests per day

### Supabase
- 500 requests per second
- No daily limits on paid plans

---

## Authentication

### Wallet Authentication
Users authenticate via Web3 wallet connection using RainbowKit/Wagmi.

### API Key Authentication
Service APIs use API keys stored in environment variables:
- `VITE_OPENAI_API_KEY`
- `VITE_NEYNAR_API_KEY`
- `VITE_SUPABASE_ANON_KEY`

---

## Testing

### API Testing
```javascript
// Example test for recommendation generation
describe('OpenAI Service', () => {
  test('generates recommendations', async () => {
    const styleProfile = {
      brands: 'Patagonia',
      fits: 'relaxed',
      aesthetics: 'minimalist',
      colors: 'earth tones'
    };
    
    const recommendations = await generateRecommendations(styleProfile);
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toHaveProperty('brandName');
  });
});
```

### Mock Data
For development and testing, the app includes fallback data when APIs are unavailable.

---

## Monitoring

### Logging
All API calls are logged with:
- Timestamp
- User ID (when available)
- Method called
- Parameters
- Response status
- Error details (if any)

### Metrics
Track key metrics:
- API response times
- Error rates
- User engagement
- Revenue metrics
- Recommendation quality scores

---

This API documentation covers all major integrations and services in the EcoStyle Match application. For implementation details, refer to the source code in the `/src/services/` directory.
