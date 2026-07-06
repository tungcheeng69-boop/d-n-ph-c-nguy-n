'use client';

import React from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { DashboardView } from '@/components/views/DashboardView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { ProjectDetailView } from '@/components/views/ProjectDetailView';
import { UsersView } from '@/components/views/UsersView';
import { ProfileView } from '@/components/views/ProfileView';

export default function SPAContainerPage() {
  const { currentView, activeProjectId, setView } = useProjectStore();

  const handleSelectProject = (id: string) => {
    setView('project-detail', id);
  };

  const handleViewChange = (view: string) => {
    setView(view);
  };

  // Điều phối render component view dựa vào SPA state
  switch (currentView) {
    case 'dashboard':
      return (
        <DashboardView
          onViewChange={handleViewChange}
          onSelectProject={handleSelectProject}
        />
      );
    case 'projects':
      return (
        <ProjectsView
          onViewChange={handleViewChange}
          onSelectProject={handleSelectProject}
        />
      );
    case 'project-detail':
      return (
        <ProjectDetailView
          projectId={activeProjectId}
          onViewChange={handleViewChange}
        />
      );
    case 'users':
      return <UsersView onViewChange={handleViewChange} />;
    case 'profile':
      return <ProfileView onViewChange={handleViewChange} />;
    default:
      return (
        <DashboardView
          onViewChange={handleViewChange}
          onSelectProject={handleSelectProject}
        />
      );
  }
}
