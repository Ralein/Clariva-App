import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clariva | Premium AI Writing Assistant',
  description: 'An inline writing assistant powered by Groq and Llama 3.3. Rephrase, condense, translate, and style text in English and Tamil.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
