import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCoupleSpace } from './contexts/CoupleSpaceContext';

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
import { InstallAPKScreen } from './screens/InstallAPKScreen';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ActiveCallOverlay } from './components/calling/ActiveCallOverlay';
import { LiveNotificationOverlay } from './components/notifications/LiveNotificationOverlay';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';

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

export default function App() {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-rose-100">
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

        <Route path="/vision-board" element={
          <ProtectedRoute>
            <ActiveSpaceRoute>
              <VisionBoardScreen />
            </ActiveSpaceRoute>
          </ProtectedRoute>
        } />

        <Route path="/install" element={<InstallAPKScreen />} />
      </Routes>
      <OfflineIndicator />
      <ActiveCallOverlay />
      <LiveNotificationOverlay />
      <NotificationDrawer />
    </div>
  );
}
