'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';

export default function GuestFeedbackPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Thank You Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Thank You for Joining!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your video consultation has ended successfully.
          </p>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Your healthcare provider will review the consultation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>If prescribed, you&apos;ll receive medication instructions via email</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>A consultation summary may be sent to your email if provided</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This consultation link is now closed. 
              If you need another consultation, please request a new link from your healthcare provider.
            </p>
          </div>

          {/* Close Button */}
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Close Window
            </Link>
          </Button>

          {/* Footer Text */}
          <p className="text-xs text-gray-500 mt-6">
            You can safely close this window now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
