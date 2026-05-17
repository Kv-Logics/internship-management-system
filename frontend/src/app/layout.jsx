import React from 'react';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';
import '../index.css';

export const metadata = {
  title: 'Internship Management System',
  description: 'Manage NITT student internships and generate certificates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className="antialiased">
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
