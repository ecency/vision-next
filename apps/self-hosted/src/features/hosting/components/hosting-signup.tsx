/**
 * Hosting Signup Component
 *
 * Allows users to sign up for Ecency managed blog hosting
 */

import { useState, useCallback } from 'react';

interface HostingSignupProps {
  apiBaseUrl?: string;
  onSuccess?: (data: { username: string; blogUrl: string }) => void;
  onError?: (error: string) => void;
}

interface PaymentInstructions {
  to: string;
  amount: string;
  memo: string;
}

type Step = 'username' | 'configure' | 'payment' | 'success';

const HIVE_USERNAME_RE = /^[a-z][a-z0-9.-]*$/;
const BLOCKCHAIN_CONFIRMATION_DELAY_MS = 5000;

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export function HostingSignup({
  apiBaseUrl = 'https://api.blogs.ecency.com/hosting',
  onSuccess,
  onError,
}: HostingSignupProps) {
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructions | null>(null);
  const [blogUrl, setBlogUrl] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Config options
  const [config, setConfig] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    styleTemplate: 'medium' as string,
    type: 'blog' as 'blog' | 'community',
    title: '',
    description: '',
  });

  const statusUrl = `${apiBaseUrl}/v1/tenants/${encodeURIComponent(username)}/status`;

  const checkUsername = useCallback(async () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 16 || !HIVE_USERNAME_RE.test(username)) {
      setError('Username must be 3-16 characters, start with a letter, and contain only lowercase letters, numbers, dots, or hyphens');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson(statusUrl);

      if (data.exists) {
        setError('This username is already taken');
        return;
      }

      // Move to configure step
      setConfig((prev) => ({ ...prev, title: `${username}'s Blog` }));
      setStep('configure');
    } catch (err: any) {
      setError(err.message || 'Failed to check username. Please try again.');
      onError?.('Failed to check username');
    } finally {
      setIsLoading(false);
    }
  }, [username, statusUrl, onError]);

  const createTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson(`${apiBaseUrl}/v1/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          config: {
            theme: config.theme,
            styleTemplate: config.styleTemplate,
            type: config.type,
            title: config.title,
            description: config.description,
          },
        }),
      });

      if (
        !data.paymentInstructions?.to ||
        !data.paymentInstructions?.amount ||
        !data.paymentInstructions?.memo ||
        !data.tenant?.blogUrl
      ) {
        throw new Error('Invalid response from server. Please try again.');
      }

      setPaymentInstructions(data.paymentInstructions);
      setBlogUrl(data.tenant.blogUrl);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to create blog');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [username, config, apiBaseUrl, onError]);

  const checkPayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson(statusUrl);

      if (data.subscriptionStatus === 'active') {
        setStep('success');
        if (blogUrl) {
          onSuccess?.({ username, blogUrl });
        }
      } else {
        setError('Payment not yet received. Please wait a few seconds and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check payment status');
    } finally {
      setIsLoading(false);
      setIsTransferring(false);
    }
  }, [username, blogUrl, statusUrl, onSuccess]);

  const sendPaymentWithKeychain = useCallback(async () => {
    if (!paymentInstructions || isTransferring) return;

    // Check if Keychain is available
    if (typeof window === 'undefined' || !(window as any).hive_keychain) {
      setError('Hive Keychain extension not found. Please install it or send payment manually.');
      return;
    }

    setIsTransferring(true);
    setError(null);
    const keychain = (window as any).hive_keychain;
    const [amountStr] = paymentInstructions.amount.split(' ');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid payment amount. Please try again.');
      setIsTransferring(false);
      return;
    }

    keychain.requestTransfer(
      username,
      paymentInstructions.to,
      amount.toFixed(3),
      paymentInstructions.memo,
      'HBD',
      (response: any) => {
        if (response.success) {
          setTimeout(checkPayment, BLOCKCHAIN_CONFIRMATION_DELAY_MS);
        } else {
          setError('Payment cancelled or failed');
          setIsTransferring(false);
        }
      }
    );
  }, [username, paymentInstructions, checkPayment, isTransferring]);

  const isBusy = isLoading || isTransferring;

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Create Your Dedicated Blog/Page
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Username */}
      {step === 'username' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="hosting-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hive Username
            </label>
            <input
              id="hosting-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your-username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your blog will be at: {username || 'username'}.blogs.ecency.com
            </p>
          </div>

          <button
            onClick={checkUsername}
            disabled={isLoading || !username}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
          >
            {isLoading ? 'Checking...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 'configure' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="hosting-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Blog Title
            </label>
            <input
              id="hosting-title"
              type="text"
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="hosting-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="hosting-description"
              value={config.description}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="hosting-style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Style Template
            </label>
            <select
              id="hosting-style"
              value={config.styleTemplate}
              onChange={(e) => setConfig((prev) => ({ ...prev, styleTemplate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="medium">Medium (Clean & Editorial)</option>
              <option value="minimal">Minimal (Simple & Focused)</option>
              <option value="magazine">Magazine (Bold & Visual)</option>
              <option value="developer">Developer (Code-friendly)</option>
              <option value="modern-gradient">Modern Gradient (Vibrant)</option>
            </select>
          </div>

          <div>
            <label htmlFor="hosting-theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select
              id="hosting-theme"
              value={config.theme}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="system">System (Auto)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('username')}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={createTenant}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Blog'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && paymentInstructions && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              Payment Required
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              Send <strong>{paymentInstructions.amount}</strong> to activate your blog.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">To:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  @{paymentInstructions.to}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  {paymentInstructions.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Memo:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  {paymentInstructions.memo}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={sendPaymentWithKeychain}
            disabled={isBusy}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
          >
            {isTransferring ? 'Processing...' : 'Pay with Keychain'}
          </button>

          <button
            onClick={checkPayment}
            disabled={isBusy}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isLoading ? 'Checking...' : 'I\'ve sent the payment'}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            You can also send the payment manually via any Hive wallet
          </p>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Your Blog is Live!
          </h3>

          <p className="text-gray-600 dark:text-gray-400">
            Your blog has been created and is now accessible at:
          </p>

          {blogUrl && isValidHttpUrl(blogUrl) ? (
            <>
              <a
                href={blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {blogUrl}
              </a>

              <button
                onClick={() => window.open(blogUrl, '_blank', 'noopener,noreferrer')}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Visit Your Blog
              </button>
            </>
          ) : (
            <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400">
              {blogUrl}
            </p>
          )}
        </div>
      )}

      {/* Pricing info */}
      {step === 'username' && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Pricing
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Standard: 0.1 HBD/month - Subdomain included</li>
            <li>Pro: 0.5 HBD/month - Custom domain support</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default HostingSignup;
