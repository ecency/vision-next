import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReblogButton } from './index';

describe('ReblogButton', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders with reblog count', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        reblogCount={5}
      />
    );
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/reblogs/)).toBeInTheDocument();
  });

  it('shows static display when reblogging is disabled', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        reblogCount={5}
        isReblogEnabled={false}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disables button for own post', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        currentUser="author"
        isAuthenticated={true}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when not authenticated', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        isAuthenticated={false}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onReblog when confirmed', async () => {
    const handleReblog = vi.fn().mockResolvedValue(undefined);
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        currentUser="reblogger"
        isAuthenticated={true}
        onReblog={handleReblog}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleReblog).toHaveBeenCalledWith({
        author: 'author',
        permlink: 'test-post',
      });
    });
  });

  it('does not call onReblog when cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const handleReblog = vi.fn();
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        currentUser="reblogger"
        isAuthenticated={true}
        onReblog={handleReblog}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleReblog).not.toHaveBeenCalled();
    });
  });

  it('supports custom confirmation', async () => {
    const customConfirm = vi.fn().mockReturnValue(true);
    const handleReblog = vi.fn().mockResolvedValue(undefined);
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        currentUser="reblogger"
        isAuthenticated={true}
        onReblog={handleReblog}
        onConfirm={customConfirm}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(customConfirm).toHaveBeenCalled();
      expect(handleReblog).toHaveBeenCalled();
    });
  });

  it('shows reblogged state after success', async () => {
    const handleReblog = vi.fn().mockResolvedValue(undefined);
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        reblogCount={5}
        currentUser="reblogger"
        isAuthenticated={true}
        onReblog={handleReblog}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveClass('text-green-500');
      expect(screen.getByText(/6/)).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    const handleReblog = vi.fn().mockRejectedValue(new Error('Network error'));
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        currentUser="reblogger"
        isAuthenticated={true}
        onReblog={handleReblog}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('supports custom labels', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        reblogCount={5}
        labels={{ reblogs: 'shares' }}
      />
    );
    expect(screen.getByText(/shares/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ReblogButton
        author="author"
        permlink="test-post"
        className="custom-class"
      />
    );
    const container = screen.getByRole('button').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});
