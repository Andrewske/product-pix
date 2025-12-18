/**
 * Re-export shadcn components for prompt-bench UI
 * Using absolute imports that Bun bundler resolves via tsconfig paths
 */

// Core form components
export { Button, buttonVariants } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Label } from '@/components/ui/label';
export { Checkbox } from '@/components/ui/checkbox';

// Select components
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Card components
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Data display
export { Badge, badgeVariants } from '@/components/ui/badge';
export { Progress } from '@/components/ui/progress';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
export { Skeleton } from '@/components/ui/skeleton';

// Dialog / Modal
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Tabs
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Collapsible
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Accordion
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Radio Group
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Feedback
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Layout utilities
export { Separator } from '@/components/ui/separator';
export { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
export { AspectRatio } from '@/components/ui/aspect-ratio';

// Tooltip
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Re-export cn utility
export { cn } from '@/lib/utils';
