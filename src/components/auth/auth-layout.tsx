import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertBox } from '@/components/ui/alert-box';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  error?: string;
  showSpotlight?: boolean;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  children,
  error,
  showSpotlight = false,
  footer
}: AuthLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      {showSpotlight && (
        <div className="absolute inset-0 studio-spotlight pointer-events-none" />
      )}
      <Card
        
        className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 shadow-xl relative z-10"
      >
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold font-display">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <AlertBox variant="error">
              {error}
            </AlertBox>
          )}
          {children}
        </CardContent>
        {footer && (
          <CardFooter className="justify-center">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}