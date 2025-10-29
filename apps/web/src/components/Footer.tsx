import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

const Footer = ({ variant = 'default' }: FooterProps) => {
  if (variant === 'minimal') {
    return (
      <footer className="border-t bg-background">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} JATA. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link
              to="/faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQs
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-background" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto max-w-screen-2xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-bold text-foreground mb-2">JATA</h3>
            <p className="text-sm text-muted-foreground">
              Your AI-powered job application assistant
            </p>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/cover-letter"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cover Letters
                </Link>
              </li>
              <li>
                <Link
                  to="/install-extension"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Extension
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>

            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} JATA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
