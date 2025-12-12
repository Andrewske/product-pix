import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    href: '/admin/refunds',
    label: 'Refunds',
    active: true,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    active: false,
  },
  {
    href: '/admin/users',
    label: 'Users',
    active: false,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    active: false,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-card border-r border-border p-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>

        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                pathname === item.href && 'bg-primary text-primary-foreground',
                !item.active && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!item.active}
            >
              {item.label}
            </Button>
          </Link>
        ))}

        <div className="pt-4 border-t border-border mt-6">
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}