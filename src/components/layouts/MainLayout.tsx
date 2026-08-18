import React from 'react';
import type { ReactNode } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const MainLayout = ({ children, pageTitle }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex min-w-0 grow flex-col ml-[var(--sidebar-width,260px)] w-[calc(100%-var(--sidebar-width,260px))]">
        <Navbar pageTitle={pageTitle} />
        <main className="grow px-[clamp(16px,3vw,34px)] pt-6 pb-[30px]">
          <div className="mx-auto w-full max-w-[1280px] rounded-[18px] border border-[rgba(219,229,227,0.95)] bg-[rgba(255,255,255,0.72)] p-[clamp(12px,1.8vw,20px)] shadow-(--shadow-card) backdrop-blur-[2px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
