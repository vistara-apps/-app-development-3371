import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Leaf, Sparkles, RefreshCw, Star } from 'lucide-react';

import ProfileForm from './components/ProfileForm';
import RecommendationCard from './components/RecommendationCard';
import EcoTag from './components/EcoTag';
import PaymentModal from './components/PaymentModal';
import ErrorBoundary from './components/ErrorBoundary';
import { usePaymentContext } from './hooks/usePaymentContext';
import { generateRecommendations } from './services/openai';
import { saveUserProfile, getUserProfile, saveRecommendation, logPayment, getUserStats } from './services/supabase';
import { identifyFarcasterUser } from './services/farcaster';
import { enhanceRecommendations, getUserTier } from './services/businessLogic';

function AppContent() {
  const { isConnected, address } = useAccount();
  const { createSession } = usePaymentContext();
  
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [freeRecommendationsUsed, setFreeRecommendationsUsed] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [farcasterUser, setFarcasterUser] = useState(null);

  // Load user data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadUserData();
      identifyUser();
    }
  }, [isConnected, address]);

  const loadUserData = async () => {
    try {
      const userId = address;
      const [profile, stats] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId)
      ]);
      
      if (profile) {
        setUserProfile(profile.style_preferences);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const identifyUser = async () => {
    try {
      const farcasterProfile = await identifyFarcasterUser(address);
      setFarcasterUser(farcasterProfile);
    } catch (error) {
      console.error('Error identifying Farcaster user:', error);
    }
  };

  const handleProfileSubmit = async (preferences) => {
    setUserProfile(preferences);
    setLoading(true);
    
    try {
      // Save profile to Supabase
      if (address) {
        await saveUserProfile(address, preferences);
      }

      // Generate AI recommendations
      const rawRecommendations = await generateRecommendations(preferences);
      
      // Enhance recommendations with business logic
      const stats = userStats || { totalRecommendations: 0, uniqueBrands: 0, totalSpent: '$0.00' };
      const enhancedRecommendations = enhanceRecommendations(rawRecommendations, preferences, stats);
      
      setRecommendations(enhancedRecommendations);
      setFreeRecommendationsUsed(1);

      // Save recommendations to Supabase
      if (address) {
        for (const rec of enhancedRecommendations) {
          await saveRecommendation(address, rec);
        }
        // Refresh user stats
        const updatedStats = await getUserStats(address);
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMoreRecommendations = () => {
    if (freeRecommendationsUsed >= 1) {
      setShowPaymentModal(true);
    } else {
      generateNewRecommendations();
    }
  };

  const generateNewRecommendations = async () => {
    setLoading(true);
    try {
      const newRecommendations = await generateRecommendations(userProfile);
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const paymentResponse = await createSession();
      
      // Log payment to Supabase
      if (address) {
        await logPayment(address, '$0.50', 'wallet');
      }
      
      setShowPaymentModal(false);
      await generateNewRecommendations();
      
      // Refresh user stats after payment
      if (address) {
        const updatedStats = await getUserStats(address);
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">EcoStyle Match</h1>
                <p className="text-white/80 text-sm">Discover eco-friendly fashion that matches your style</p>
              </div>
            </div>
            <ConnectButton />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <EcoTag variant="positive">Sustainable Fashion</EcoTag>
            <EcoTag variant="neutral" icon={Star}>AI-Powered</EcoTag>
            <EcoTag variant="positive">Personalized</EcoTag>
          </div>
        </header>

        {!isConnected ? (
          <div className="text-center py-12">
            <div className="bg-surface/10 glass-effect rounded-xl p-8 max-w-md mx-auto">
              <Leaf className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-3">Connect Your Wallet</h2>
              <p className="text-white/80 mb-6">
                Connect your wallet to start discovering eco-friendly fashion that matches your unique style.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {!userProfile ? (
                <ProfileForm onSubmit={handleProfileSubmit} />
              ) : (
                <>
                  <ProfileForm 
                    editMode={false} 
                    preferences={userProfile}
                  />
                  
                  <div className="bg-surface rounded-lg p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Your Impact</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Total recommendations</span>
                        <span className="font-semibold text-primary">{userStats?.totalRecommendations || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Eco-brands discovered</span>
                        <span className="font-semibold text-primary">{userStats?.uniqueBrands || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Total invested</span>
                        <span className="font-semibold text-accent">{userStats?.totalSpent || '$0.00'}</span>
                      </div>
                      {userStats && (
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">User tier</span>
                          <span className="font-semibold text-primary">{getUserTier(userStats).name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Recommendations */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="bg-surface rounded-lg p-8">
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Finding Perfect Matches...
                    </h3>
                    <p className="text-text-secondary">
                      Our AI is curating eco-friendly fashion just for you
                    </p>
                  </div>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-white">
                      Your Eco-Fashion Recommendations
                    </h2>
                    <button
                      onClick={handleGetMoreRecommendations}
                      className="flex items-center gap-2 bg-surface text-primary px-4 py-2 rounded-md font-medium hover:bg-surface/90 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {freeRecommendationsUsed >= 1 ? 'Get More ($0.50)' : 'Refresh'}
                    </button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recommendations.map((recommendation, index) => (
                      <RecommendationCard
                        key={index}
                        recommendation={recommendation}
                        variant="withImage"
                      />
                    ))}
                  </div>
                </div>
              ) : userProfile ? (
                <div className="text-center py-12">
                  <div className="bg-surface rounded-lg p-8">
                    <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Ready to discover sustainable fashion?
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Click below to get your first set of personalized recommendations
                    </p>
                    <button
                      onClick={() => handleProfileSubmit(userProfile)}
                      className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition-all"
                    >
                      Get Recommendations
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-surface/10 glass-effect rounded-lg p-8">
                    <Sparkles className="w-12 h-12 text-white/60 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Create Your Style Profile
                    </h3>
                    <p className="text-white/80">
                      Tell us about your style preferences to get personalized eco-fashion recommendations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPayment={handlePayment}
          loading={paymentLoading}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
