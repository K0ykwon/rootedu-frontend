/**
 * Admin Medsky Analytics Page
 * 
 * This page provides administrators with analytics and management tools
 * for the medsky analysis functionality, including user data and results.
 */

import { Metadata } from 'next';
import { MedskyAnalyticsDashboard } from '@/components/admin/MedskyAnalyticsDashboard';

export const metadata: Metadata = {
  title: '생기부 분석 관리 | 관리자 대시보드',
  description: '알약툰 생기부 AI 분석 사용자 데이터 및 결과 관리 대시보드',
};

export default function AdminMedskyAnalyticsPage() {
  return <MedskyAnalyticsDashboard />;
}