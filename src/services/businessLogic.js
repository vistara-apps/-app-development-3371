// Business Logic for EcoStyle Match
// Handles pricing, bundles, user analytics, and business rules

export const PRICING = {
  SINGLE_RECOMMENDATION: 0.50,
  BUNDLE_12: {
    price: 5.00,
    count: 12,
    savings: 1.00
  },
  BUNDLE_25: {
    price: 10.00,
    count: 25,
    savings: 2.50
  },
  SUBSCRIPTION_MONTHLY: {
    price: 15.00,
    unlimited: true
  }
};

export const FREE_RECOMMENDATIONS_LIMIT = 1;

// Pricing Calculator
export function calculatePrice(recommendationCount, bundleType = null) {
  if (bundleType) {
    return PRICING[bundleType];
  }
  
  if (recommendationCount <= FREE_RECOMMENDATIONS_LIMIT) {
    return { price: 0, type: 'free' };
  }
  
  const paidCount = recommendationCount - FREE_RECOMMENDATIONS_LIMIT;
  return {
    price: paidCount * PRICING.SINGLE_RECOMMENDATION,
    type: 'pay-per-use',
    count: paidCount
  };
}

// Bundle Recommendations
export function getBundleOptions() {
  return [
    {
      id: 'single',
      name: 'Single Recommendation',
      price: PRICING.SINGLE_RECOMMENDATION,
      count: 1,
      description: 'Perfect for trying out our service',
      popular: false
    },
    {
      id: 'bundle_12',
      name: '12 Recommendations Bundle',
      price: PRICING.BUNDLE_12.price,
      count: PRICING.BUNDLE_12.count,
      originalPrice: PRICING.BUNDLE_12.count * PRICING.SINGLE_RECOMMENDATION,
      savings: PRICING.BUNDLE_12.savings,
      description: 'Great value for regular users',
      popular: true
    },
    {
      id: 'bundle_25',
      name: '25 Recommendations Bundle',
      price: PRICING.BUNDLE_25.price,
      count: PRICING.BUNDLE_25.count,
      originalPrice: PRICING.BUNDLE_25.count * PRICING.SINGLE_RECOMMENDATION,
      savings: PRICING.BUNDLE_25.savings,
      description: 'Best value for fashion enthusiasts',
      popular: false
    },
    {
      id: 'subscription',
      name: 'Monthly Unlimited',
      price: PRICING.SUBSCRIPTION_MONTHLY.price,
      count: 'unlimited',
      description: 'Unlimited recommendations + premium features',
      popular: false
    }
  ];
}

// User Tier Management
export function getUserTier(userStats) {
  const { totalRecommendations, totalSpent } = userStats;
  const spentAmount = parseFloat(totalSpent.replace('$', ''));
  
  if (spentAmount >= 50 || totalRecommendations >= 100) {
    return {
      tier: 'premium',
      name: 'Eco Fashion Expert',
      benefits: ['Priority support', 'Early access to new brands', 'Exclusive eco-tips'],
      discount: 0.15 // 15% discount
    };
  } else if (spentAmount >= 20 || totalRecommendations >= 40) {
    return {
      tier: 'advanced',
      name: 'Sustainable Style Enthusiast',
      benefits: ['Style analytics', 'Brand insights', 'Monthly eco-report'],
      discount: 0.10 // 10% discount
    };
  } else if (spentAmount >= 5 || totalRecommendations >= 10) {
    return {
      tier: 'explorer',
      name: 'Eco Style Explorer',
      benefits: ['Style tracking', 'Impact metrics'],
      discount: 0.05 // 5% discount
    };
  }
  
  return {
    tier: 'starter',
    name: 'Eco Style Starter',
    benefits: ['Basic recommendations'],
    discount: 0
  };
}

// Recommendation Quality Scoring
export function scoreRecommendation(recommendation, userProfile) {
  let score = 0;
  
  // Brand alignment (0-30 points)
  const userBrands = userProfile.brands.toLowerCase().split(',').map(b => b.trim());
  const recBrand = recommendation.brandName.toLowerCase();
  if (userBrands.some(brand => recBrand.includes(brand) || brand.includes(recBrand))) {
    score += 30;
  } else {
    score += 15; // Partial credit for sustainable brands
  }
  
  // Style match (0-25 points)
  const userAesthetics = userProfile.aesthetics.toLowerCase();
  const styleMatch = recommendation.styleMatch.toLowerCase();
  if (styleMatch.includes(userAesthetics) || userAesthetics.includes(styleMatch)) {
    score += 25;
  } else {
    score += 10; // Partial credit
  }
  
  // Color alignment (0-20 points)
  const userColors = userProfile.colors.toLowerCase();
  const description = recommendation.description.toLowerCase();
  if (description.includes(userColors) || userColors.includes('any') || userColors.includes('all')) {
    score += 20;
  } else {
    score += 10; // Partial credit
  }
  
  // Eco impact strength (0-25 points)
  const ecoImpact = recommendation.ecoImpact.toLowerCase();
  if (ecoImpact.includes('recycled') || ecoImpact.includes('organic') || ecoImpact.includes('sustainable')) {
    score += 25;
  } else if (ecoImpact.includes('eco') || ecoImpact.includes('green')) {
    score += 15;
  } else {
    score += 5;
  }
  
  return Math.min(score, 100); // Cap at 100
}

// User Engagement Analytics
export function calculateEngagementMetrics(userStats, recommendations) {
  const { totalRecommendations, uniqueBrands, totalSpent } = userStats;
  
  return {
    diversityScore: Math.min((uniqueBrands / Math.max(totalRecommendations, 1)) * 100, 100),
    engagementLevel: totalRecommendations > 20 ? 'high' : totalRecommendations > 5 ? 'medium' : 'low',
    averageSpendPerRecommendation: totalRecommendations > 0 ? 
      (parseFloat(totalSpent.replace('$', '')) / totalRecommendations).toFixed(2) : '0.00',
    recommendationQuality: recommendations.length > 0 ? 
      recommendations.reduce((sum, rec) => sum + (rec.qualityScore || 75), 0) / recommendations.length : 0
  };
}

// Personalization Engine
export function enhanceRecommendations(recommendations, userProfile, userStats) {
  return recommendations.map(rec => {
    const qualityScore = scoreRecommendation(rec, userProfile);
    const userTier = getUserTier(userStats);
    
    return {
      ...rec,
      qualityScore,
      userTier: userTier.tier,
      personalizedReason: generatePersonalizedReason(rec, userProfile, qualityScore),
      sustainabilityRating: calculateSustainabilityRating(rec),
      priceRange: categorizePriceRange(rec.estimatedPrice)
    };
  });
}

function generatePersonalizedReason(recommendation, userProfile, qualityScore) {
  const reasons = [];
  
  if (qualityScore >= 80) {
    reasons.push(`Perfect match for your ${userProfile.aesthetics} style`);
  } else if (qualityScore >= 60) {
    reasons.push(`Good fit for your style preferences`);
  }
  
  if (userProfile.colors.toLowerCase().includes('earth') && 
      recommendation.description.toLowerCase().includes('natural')) {
    reasons.push('Matches your earth tone preference');
  }
  
  if (recommendation.ecoImpact.includes('recycled')) {
    reasons.push('Made from recycled materials');
  }
  
  return reasons.join(' • ') || 'Sustainable fashion choice';
}

function calculateSustainabilityRating(recommendation) {
  const ecoImpact = recommendation.ecoImpact.toLowerCase();
  let rating = 3; // Base rating
  
  if (ecoImpact.includes('organic')) rating += 1;
  if (ecoImpact.includes('recycled')) rating += 1;
  if (ecoImpact.includes('water') && ecoImpact.includes('save')) rating += 1;
  if (ecoImpact.includes('carbon') && ecoImpact.includes('neutral')) rating += 1;
  if (ecoImpact.includes('fair trade')) rating += 1;
  
  return Math.min(rating, 5);
}

function categorizePriceRange(priceString) {
  const price = parseFloat(priceString.replace('$', ''));
  
  if (price < 30) return 'budget';
  if (price < 80) return 'mid-range';
  if (price < 150) return 'premium';
  return 'luxury';
}

// A/B Testing Framework
export function getExperimentVariant(userId, experimentName) {
  // Simple hash-based assignment for consistent user experience
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const experiments = {
    'pricing_display': ['control', 'bundle_emphasis', 'savings_highlight'],
    'recommendation_layout': ['grid', 'list', 'carousel'],
    'eco_impact_display': ['detailed', 'simple', 'visual']
  };
  
  const variants = experiments[experimentName] || ['control'];
  return variants[Math.abs(hash) % variants.length];
}

// Business Intelligence
export function generateBusinessInsights(allUserStats) {
  const totalUsers = allUserStats.length;
  const activeUsers = allUserStats.filter(stats => stats.totalRecommendations > 0).length;
  const premiumUsers = allUserStats.filter(stats => getUserTier(stats).tier === 'premium').length;
  
  const totalRevenue = allUserStats.reduce((sum, stats) => 
    sum + parseFloat(stats.totalSpent.replace('$', '')), 0);
  
  const avgRecommendationsPerUser = totalUsers > 0 ? 
    allUserStats.reduce((sum, stats) => sum + stats.totalRecommendations, 0) / totalUsers : 0;
  
  return {
    userMetrics: {
      total: totalUsers,
      active: activeUsers,
      premium: premiumUsers,
      conversionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
    },
    revenueMetrics: {
      total: totalRevenue.toFixed(2),
      arpu: totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : 0,
      avgRecommendationsPerUser: avgRecommendationsPerUser.toFixed(1)
    },
    growthMetrics: {
      // These would be calculated with time-series data
      monthlyGrowthRate: 0,
      retentionRate: 0,
      churnRate: 0
    }
  };
}
