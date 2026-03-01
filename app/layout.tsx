import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Nesting 1D Pro',
  description: 'Otimização de corte linear e gestão de estoque de retalhos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] text-[var(--color-ink)] bg-[var(--color-bg)]">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'border-4 border-[var(--color-ink)] bg-white rounded-none shadow-[8px_8px_0px_0px_var(--color-ink)] font-mono text-[var(--color-ink)] font-bold uppercase tracking-widest',
          }}
        />
      </body>
    </html>
  );
}
