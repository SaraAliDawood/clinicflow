import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClinicFlow — Appointment Scheduling',
  description: 'Clinic appointment scheduling with availability generation and double-booking prevention.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
