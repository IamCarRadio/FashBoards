/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { ViewportProvider, useViewport } from './context/ViewportContext';

import { MeshBackground } from './components/ui/MeshBackground';
import { TopBar } from './components/navigation/TopBar';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { MobileBottomNav, type TabId } from './components/navigation/MobileBottomNav';
import { FilterBar } from './components/navigation/FilterBar';
import { MobileFilterSheet } from './components/navigation/MobileFilterSheet';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { FirebaseConfigModal } from './components/firebase/FirebaseConfigModal';
import { ViewportFrame } from './components/viewport/ViewportFrame';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { ServicesScreen } from './screens/ServicesScreen';
import { DoctorsScreen } from './screens/DoctorsScreen';
import { PharmacyScreen } from './screens/PharmacyScreen';
import { AIScreen } from './screens/AIScreen';
import { UploadScreen } from './screens/UploadScreen';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const { mode } = useViewport();

  const isEmulatingMobile = mode === 'mobile_390';

  return (
    <div className="relative min-h-screen flex flex-col antialiased">
      {/* Animated Gradient Mesh Background */}
      <MeshBackground />

      {/* Top Bar Navigation */}
      <TopBar onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)} />

      {/* Main Container Layout */}
      <div className="relative z-10 flex-1 flex w-full max-w-[1600px] mx-auto">
        {/* Desktop Collapsible Left Sidebar (Hidden in 390px emulation mode or mobile) */}
        {!isEmulatingMobile && (
          <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Content Viewport Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-12">
          {/* Global Filter Bar */}
          <div className="px-4 sm:px-6 pt-4 pb-2">
            <FilterBar />
          </div>

          {/* Screen Switcher with 250ms fade + slide transition */}
          <div className="flex-1 px-4 sm:px-6 py-4">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && <HomeScreen key="home" />}
              {activeTab === 'services' && <ServicesScreen key="services" />}
              {activeTab === 'doctors' && <DoctorsScreen key="doctors" />}
              {activeTab === 'pharmacy' && <PharmacyScreen key="pharmacy" />}
              {activeTab === 'ai' && <AIScreen key="ai" />}
              {activeTab === 'upload' && <UploadScreen key="upload" />}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Floating Glass Bottom Nav (Visible on mobile or in 390px emulation mode) */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile Slide-Up Drag-to-Close Filter Sheet */}
      <MobileFilterSheet />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Firebase Project Connection Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <ViewportProvider>
            <ViewportFrame>
              <AppContent />
            </ViewportFrame>
          </ViewportProvider>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
