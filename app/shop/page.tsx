import type { Metadata } from 'next';
import { DemoShop } from '@/components/demo-shop';

export const metadata: Metadata = { title: 'Everyday Supply: CentralMonie checkout demo' };

export default function Page() {
  return <DemoShop />;
}
