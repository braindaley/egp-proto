'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome popup before
    try {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

      if (!hasSeenWelcome) {
        // Show popup after a brief delay to ensure page is loaded
        setTimeout(() => {
          setOpen(true);
        }, 1000);
      }
    } catch (error) {
      // If localStorage is not available, still show popup
      setTimeout(() => {
        setOpen(true);
      }, 1000);
    }
  }, []);

  const handleGetStarted = () => {
    // Mark as seen and close
    try {
      localStorage.setItem('hasSeenWelcome', 'true');
    } catch (error) {
      // Handle localStorage error silently
    }
    setOpen(false);
  };

  const handleLogin = () => {
    // Mark as seen
    try {
      localStorage.setItem('hasSeenWelcome', 'true');
    } catch (error) {
      // Handle localStorage error silently
    }
    setOpen(false);
  };

  const handleClose = () => {
    // Mark as seen even if they close without clicking buttons
    try {
      localStorage.setItem('hasSeenWelcome', 'true');
    } catch (error) {
      // Handle localStorage error silently
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-6">
          <DialogTitle className="text-3xl font-bold text-center">
            Welcome to eVotersUnited.org
          </DialogTitle>

          <DialogDescription className="text-lg leading-relaxed space-y-4 text-left max-w-none">
            <div className="space-y-4">
              <p>
                At eVotersUnited.org, our mission is to bring the power back to the people by connecting constituents directly with their elected officials in a simple, centralized, and meaningful way.
              </p>

              <p>
                Don't let your voice fade into the noise of social media — be heard by the leaders who represent you. An engaged public is the foundation of a healthy democracy.
              </p>

              <p>
                By making advocacy effortless and impactful, eVotersUnited.org helps ensure your perspective isn't just part of the conversation — it drives it.
              </p>

              <p>
                We're different: eVotersUnited.org is your all-in-one hub — the only place you need to get curated campaigns, news, and legislation on issues that matter, while sending messages effortlessly to the policymakers who can act on them.
              </p>

              <p className="text-xl font-semibold text-primary">
                Join the advocacy groups already here, and discover the power of your VOICE!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            size="lg"
            className="flex-1 text-lg py-6"
            onClick={handleGetStarted}
            asChild
          >
            <Link href="/signup">
              Get Started
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1 text-lg py-6"
            onClick={handleLogin}
            asChild
          >
            <Link href="/login">
              Log In
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}