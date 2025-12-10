import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 px-4 sm:px-6 lg:px-8" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-bold" role="banner">ProductPix</span>
            <p className="text-sm text-muted-foreground">
              Professional Product Photos in Seconds
            </p>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-8" role="list">
              <li>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                  aria-describedby="pricing-link-description"
                >
                  Pricing
                </a>
                <span id="pricing-link-description" className="sr-only">
                  View pricing plans and packages
                </span>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                  aria-describedby="login-link-description"
                >
                  Login
                </Link>
                <span id="login-link-description" className="sr-only">
                  Sign in to your account
                </span>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                  aria-describedby="signup-link-description"
                >
                  Sign Up
                </Link>
                <span id="signup-link-description" className="sr-only">
                  Create a new account
                </span>
              </li>
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label="Legal information">
            <ul className="flex gap-8" role="list">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                  aria-describedby="terms-link-description"
                >
                  Terms
                </a>
                <span id="terms-link-description" className="sr-only">
                  Read our terms of service
                </span>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                  aria-describedby="privacy-link-description"
                >
                  Privacy
                </a>
                <span id="privacy-link-description" className="sr-only">
                  Read our privacy policy
                </span>
              </li>
            </ul>
          </nav>
        </div>

        {/* Copyright Notice */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} ProductPix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}