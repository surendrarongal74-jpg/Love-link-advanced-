import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCoupleSpace } from './contexts/CoupleSpaceContext';
import { NotFoundScreen } from './screens/NotFoundScreen';

import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ChatScreen } from './screens/ChatScreen';
import { MemoriesScreen } from './screens/MemoriesScreen';
import { GameScreen } from './screens/GameScreen';
import { LoveLanguageScreen } from './screens/LoveLanguageScreen';

import { DailyNotesScreen } from './screens/DailyNotesScreen';
import { SurpriseSchedulerScreen } from './screens/SurpriseSchedulerScreen';
import { LoveMapScreen } from './screens/LoveMapScreen';
import { DiaryScreen } from './screens/DiaryScreen';
import { TruthOrDareScreen } from './screens/TruthOrDareScreen';
import { SmartRemindersScreen } from './screens/SmartRemindersScreen';
import { WhoLovesMoreScreen } from './screens/WhoLovesMoreScreen';
import { AIPlannerScreen } from './screens/AIPlannerScreen';
import { AiraScreen } from './screens/AiraScreen';
import { LoveversePlayhouseScreen } from './screens/LoveversePlayhouseScreen';
import { VisionBoardScreen } from './screens/VisionBoardScreen';
import { LoveCouponsScreen } from './screens/LoveCouponsScreen';
import { MarketScreen } from './screens/MarketScreen';
import { EarnCoinsScreen } from './screens/EarnCoinsScreen';
import { MyCollectionScreen } from './screens/MyCollectionScreen';
import { LoveverseThemesScreen } from './screens/LoveverseThemesScreen';
import { LoveCoinsProvider } from './contexts/LoveCoinsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { InstallAPKScreen } from './screens/InstallAPKScreen';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ActiveCallOverlay } from './components/calling/ActiveCallOverlay';
import { LiveNotificationOverlay } from './components/notifications/LiveNotificationOverlay';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { IncomingGiftCelebrationModal } from './components/widgets/IncomingGiftCelebrationModal';
import { PublicInfoScreen } from './screens/PublicInfoScreen';
import { ConsentBanner } from './components/legal/ConsentBanner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-rose-50 flex items-center justify-center text-rose-300">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function SpaceRoute({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { space, loading } = useCoupleSpace();
  
  if (loading) return <div className="min-h-screen bg-rose-50 flex items-center justify-center text-rose-300">Loading...</div>;
  
  if (!userData?.coupleSpaceId) {
    return <Navigate to="/onboarding" />;
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center text-rose-400 gap-3">
        <div className="w-10 h-10 border-3 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        <span className="text-xs font-medium">Connecting to private space...</span>
      </div>
    );
  }
  
  return <>{children}</>;
}

function ActiveSpaceRoute({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { space, partnerData, loading } = useCoupleSpace();
  
  if (loading) return <div className="min-h-screen bg-rose-50 flex items-center justify-center text-rose-300">Loading...</div>;
  
  if (!userData?.coupleSpaceId) {
    return <Navigate to="/onboarding" />;
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center text-rose-400 gap-3">
        <div className="w-10 h-10 border-3 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        <span className="text-xs font-medium">Connecting to private space...</span>
      </div>
    );
  }

  if (!partnerData) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Love Link — Private Couple Space',
  '/auth': 'Sign In • Love Link',
  '/onboarding': 'Get Started • Love Link',
  '/chat': 'Chat & Love Notes • Love Link',
  '/memories': 'Our Scrapbook & Memories • Love Link',
  '/game': 'Daily Sync & Games • Love Link',
  '/market': 'Loveverse Market & Rewards • Love Link',
  '/earn-coins': 'Earn Love Coins • Love Link',
  '/my-collection': 'My Collection & Wardrobe • Love Link',
  '/lovelanguage': 'Love Language Quiz • Love Link',
  '/notes': 'Daily Sticky Notes • Love Link',
  '/scheduler': 'Surprise Scheduler • Love Link',
  '/map': 'Love Map & Locations • Love Link',
  '/diary': 'Secret Couple Diary • Love Link',
  '/truth-or-dare': 'Truth or Dare • Love Link',
  '/reminders': 'Smart Reminders • Love Link',
  '/who-loves-more': 'Who Loves More? • Love Link',
  '/aira': 'AIRA Love Companion • Love Link',
  '/date-planner': 'AI Date Planner • Love Link',
  '/playhouse': 'Loveverse Playhouse • Love Link',
  '/themes': 'Loveverse Themes & Visual Worlds • Love Link',
  '/vision-board': 'Couple Vision Board • Love Link',
  '/love-coupons': 'Love Coupons Vault • Love Link',
  '/install': 'Install Love Link App • Love Link',
  '/features': 'Features & Highlights • Love Link',
  '/about': 'About Us • Love Link',
  '/privacy': 'Privacy Policy • Love Link',
  '/terms': 'Terms of Service • Love Link',
};

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = ROUTE_TITLES[location.pathname] || 'Love Link — Private Couple Space';
    try {
      const canonical = document.getElementById('canonical-url');
      if (canonical) {
        canonical.setAttribute('href', `${window.location.origin}${location.pathname}`);
      }
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', `${window.location.origin}${location.pathname}`);
      }
    } catch (e) {}
  }, [location.pathname]);

  return (
    <LoveCoinsProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-white max-w-md mx-auto shadow-2xl relative border-x border-rose-100 overflow-x-clip">
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
        
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingScreen />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <SpaceRoute>
              <HomeScreen />
            </SpaceRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <ChatScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/memories" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <MemoriesScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/game" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <GameScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/lovelanguage" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <LoveLanguageScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/notes" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <DailyNotesScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/scheduler" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <SurpriseSchedulerScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/map" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <LoveMapScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/diary" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <DiaryScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/truth-or-dare" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <TruthOrDareScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/reminders" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <SmartRemindersScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/who-loves-more" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <WhoLovesMoreScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/aira" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <AiraScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/date-planner" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <AIPlannerScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/playhouse" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <LoveversePlayhouseScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/themes" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <LoveverseThemesScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/vision-board" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <VisionBoardScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/love-coupons" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <LoveCouponsScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/market" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <MarketScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/earn-coins" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <EarnCoinsScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/my-collection" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <MyCollectionScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/install" element={<InstallAPKScreen />} />
        
        {/* Public Information, Feature Showcase, DPDP Privacy & Data Rights routes */}
        <Route path="/features" element={<PublicInfoScreen />} />
        <Route path="/about" element={<PublicInfoScreen />} />
        <Route path="/privacy" element={<PublicInfoScreen />} />
        <Route path="/privacy-notice" element={<PublicInfoScreen />} />
        <Route path="/data-rights" element={<PublicInfoScreen />} />
        <Route path="/terms" element={<PublicInfoScreen />} />

        {/* Graceful 404 Not Found route */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      <OfflineIndicator />
      <ActiveCallOverlay />
      <LiveNotificationOverlay />
      <NotificationDrawer />
      <IncomingGiftCelebrationModal />
      <ConsentBanner />
      </div>
      </ThemeProvider>
    </LoveCoinsProvider>
  );
}

