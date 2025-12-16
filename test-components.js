import { Button } from './src/components/ui/button.tsx';
import { Input } from './src/components/ui/input.tsx';
import { Card, CardHeader, CardTitle, CardContent } from './src/components/ui/card.tsx';
import { Badge } from './src/components/ui/badge.tsx';

// Test button
const button = <Button size="xs" variant="accent">Test</Button>;
console.log('Button created successfully');

// Test input
const input = <Input placeholder="test" />;
console.log('Input created successfully');

// Test card
const card = <Card size="sm"><CardHeader><CardTitle>Test</CardTitle></CardHeader><CardContent>Content</CardContent></Card>;
console.log('Card created successfully');

// Test badge
const badge = <Badge>Test</Badge>;
console.log('Badge created successfully');

console.log('All components created successfully');
