// src/components/layout/footer.tsx
export function Footer() {
  return (
    <>
      <div className="border-t border-border/50" />
      <footer className="border-t border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} ProductPix. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
