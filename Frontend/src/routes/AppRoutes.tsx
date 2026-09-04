import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

import { LandingPage } from '../pages/landing/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';

import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { GovernmentDashboard } from '../pages/government/GovernmentDashboard';
import { UniversityDashboard } from '../pages/university/UniversityDashboard';
import { IndustryDashboard } from '../pages/industry/IndustryDashboard';

import { SubmitProblemPage } from '../pages/problems/SubmitProblemPage';
import { ProblemDetailsPage } from '../pages/problems/ProblemDetailsPage';
import { MatchingCenterPage } from '../pages/matching/MatchingCenterPage';
import { CollaborationDetailsPage } from '../pages/collaborations/CollaborationDetailsPage';
import { ProjectWorkspacePage } from '../pages/projects/ProjectWorkspacePage';
import { ProposalPage } from '../pages/proposals/ProposalPage';
import { ImpactDashboardPage } from '../pages/impact/ImpactDashboardPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Citizen Protected Routes */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/submit"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <SubmitProblemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/problems"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/notifications"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/profile"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Government Protected Routes */}
        <Route
          path="/government"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <GovernmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/problems"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <GovernmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/validation"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <GovernmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/matching"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <MatchingCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/collaborations"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <MatchingCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/projects"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <MatchingCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/impact"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <ImpactDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government/notifications"
          element={
            <ProtectedRoute allowedRoles={['government']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* University Protected Routes */}
        <Route
          path="/university"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <UniversityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/university/opportunities"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <UniversityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/university/requests"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <UniversityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/university/projects"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <UniversityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/university/impact"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <ImpactDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/university/notifications"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/university/profile"
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Industry Protected Routes */}
        <Route
          path="/industry"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/opportunities"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/requests"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/projects"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/deployment"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/impact"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <ImpactDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/notifications"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/profile"
          element={
            <ProtectedRoute allowedRoles={['industry']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Shared Detail Routes (Protected by default authentication) */}
        <Route
          path="/problems/:id"
          element={
            <ProtectedRoute>
              <ProblemDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collaborations/:id"
          element={
            <ProtectedRoute>
              <CollaborationDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/proposal"
          element={
            <ProtectedRoute>
              <ProposalPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
