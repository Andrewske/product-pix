import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'featured';
  isLoading?: boolean;
  buttonText?: string;
  features?: Array<{ icon: React.ReactNode; text: string }>;
}

export function PricingCard({
  title,
  price,
  description,
  onClick,
  variant = 'default',
  isLoading = false,
  buttonText = 'Get Started',
  features,
}: PricingCardProps): React.ReactElement {
  const isFeatured = variant === 'featured';

  return (
    <Card
      variant="studio"
      className={cn(
        "relative p-8 flex flex-col",
        isFeatured && "bg-foreground text-background border-2 border-success scale-105 shadow-2xl",
        !isFeatured && "border"
      )}
      hover
    >
      <CardHeader className="p-0 mb-6 flex-shrink-0">
        <CardTitle className="text-2xl font-bold leading-tight mb-4 font-display">
          {title}
        </CardTitle>
        <div className="space-y-2">
          <div className="text-3xl font-bold font-mono">
            {price}
          </div>
        </div>
      </CardHeader>
       <CardContent className="p-0 flex-grow flex flex-col justify-end">
         <p className="text-sm text-muted-foreground mb-6">
           {description}
         </p>
         {features && (
           <ul className="space-y-4 mb-6 text-sm">
             {features.map((feature, index) => (
               <li key={index} className="flex items-center gap-2">
                 {feature.icon}
                 {feature.text}
               </li>
             ))}
           </ul>
         )}
       </CardContent>
       <CardFooter className="p-0 mt-auto">
         <Button
           className={cn(
             "w-full",
             isFeatured && "bg-background text-foreground hover:bg-background/90"
           )}
           variant={isFeatured ? "default" : "accent"}
           size="xl"
           onClick={onClick}
           disabled={isLoading}
         >
           {isLoading ? 'Creating...' : buttonText}
         </Button>
       </CardFooter>
    </Card>
  );
}