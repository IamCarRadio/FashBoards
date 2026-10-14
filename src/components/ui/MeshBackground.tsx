import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const MeshBackground: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {theme === 'dark' ? (
        <>
          {/* Deep base #0A0E1A */}
          <div className="absolute inset-0 bg-[#0A0E1A]" />

          {/* Indigo mesh orb */}
          <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-br from-indigo-600/18 via-indigo-800/10 to-transparent blur-[120px] animate-mesh-1" />

          {/* Cyan mesh orb */}
          <div className="absolute top-[25%] -right-[15%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-bl from-cyan-500/14 via-sky-600/8 to-transparent blur-[130px] animate-mesh-2" />

          {/* Violet secondary orb near bottom */}
          <div className="absolute -bottom-[20%] left-[25%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-tr from-purple-800/10 via-indigo-900/12 to-transparent blur-[140px] animate-mesh-1" />

          {/* Subtle noise grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
        </>
      ) : (
        <>
          {/* Light base #F6F8FC */}
          <div className="absolute inset-0 bg-[#F6F8FC]" />

          {/* Soft indigo tint */}
          <div className="absolute -top-[10%] -left-[5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-200/25 blur-[100px]" />

          {/* Soft cyan tint */}
          <div className="absolute top-[30%] -right-[10%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full bg-cyan-200/20 blur-[100px]" />

          {/* Delicate grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
        </>
      )}
    </div>
  );
};
