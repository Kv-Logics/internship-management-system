import React from 'react';
import { Providers } from './providers';
import ProtectedLayout from './layout-client';
import '../index.css';

export const metadata = {
  title: 'NITT Internship Management System',
  description: 'Official academic portal of National Institute of Technology, Tiruchirappalli to coordinate student internships, monitor periods, and verify certificates.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href="https://ims.nitt.edu" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ims.nitt.edu" />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content="https://ims.nitt.edu/nitt_logo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://ims.nitt.edu" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content="https://ims.nitt.edu/nitt_logo.png" />
      </head>
      <body className="antialiased">
        <Providers>
          <ProtectedLayout>{children}</ProtectedLayout>
        </Providers>
      </body>
    </html>
  );
}
