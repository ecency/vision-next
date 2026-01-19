'use client';

import type { Operation } from '@hiveio/dhive';
import { ReblogButton as BaseReblogButton } from '@ecency/ui';
import { UilRedo } from '@tooni/iconscout-unicons-react';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { t } from '@/core';
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from '../hooks';

interface ReblogButtonProps {
  author: string;
  permlink: string;
  reblogCount?: number;
  className?: string;
}

function ReblogIcon({ className }: { className?: string }) {
  return <UilRedo className={className} />;
}

export function ReblogButton({
  author,
  permlink,
  reblogCount = 0,
  className,
}: ReblogButtonProps) {
  const { user, broadcast } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const queryClient = useQueryClient();

  const handleReblog = useCallback(async () => {
    if (!user) return;

    // Create the reblog custom_json operation
    const reblogOp: Operation = [
      'custom_json',
      {
        required_auths: [],
        required_posting_auths: [user.username],
        id: 'follow',
        json: JSON.stringify([
          'reblog',
          {
            account: user.username,
            author,
            permlink,
          },
        ]),
      },
    ];

    await broadcast([reblogOp]);

    // Invalidate the entry query to refresh reblog count
    queryClient.invalidateQueries({
      queryKey: ['entry', author, permlink],
    });
  }, [user, author, permlink, broadcast, queryClient]);

  return (
    <BaseReblogButton
      author={author}
      permlink={permlink}
      reblogCount={reblogCount}
      currentUser={user?.username}
      isReblogEnabled={isAuthEnabled}
      isAuthenticated={isAuthenticated}
      onReblog={handleReblog}
      className={className}
      labels={{
        reblogs: t('reblogs'),
        reblogging: t('reblogging'),
        confirmMessage: t('reblog_confirm'),
        loginTitle: t('login_to_reblog'),
        ownPostTitle: t('cant_reblog_own'),
        rebloggedTitle: t('already_reblogged'),
        reblogTitle: t('reblog_to_followers'),
      }}
      icon={<ReblogIcon className="w-4 h-4" />}
    />
  );
}
