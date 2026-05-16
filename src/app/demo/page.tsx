import type { Metadata } from 'next';
import DemoLessonClient from './DemoLessonClient';

export const metadata: Metadata = {
  title: 'Engli — სატესტო გაკვეთილი',
  description: 'სცადე Engli — ერთი მოკლე ინგლისური გაკვეთილი, რეგისტრაციის გარეშე.',
  robots: { index: true, follow: true }
};

export default function DemoPage() {
  return <DemoLessonClient />;
}
