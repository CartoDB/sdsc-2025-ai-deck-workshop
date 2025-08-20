import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SDSC Workshop Demo - Airport Data Visualization',
  description: 'Interactive map visualization of global airport data with AI-powered chat interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}