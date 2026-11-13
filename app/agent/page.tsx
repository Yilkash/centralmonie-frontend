import type { Metadata } from 'next';
import { AgentDashboard } from '@/components/agent-dashboard';

export const metadata: Metadata = { title: 'CentralMonie agent' };

export default function Page() {
  return <AgentDashboard />;
}
