import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoteButton } from './index';

const mockVotes = [
  { voter: 'user1', weight: 10000 },
  { voter: 'user2', weight: 5000 },
  { voter: 'user3', weight: 10000 },
];

describe('VoteButton', () => {
  it('renders with vote count', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
      />
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/likes/)).toBeInTheDocument();
  });

  it('renders without count when showCount is false', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        showCount={false}
      />
    );
    expect(screen.queryByText(/3/)).not.toBeInTheDocument();
  });

  it('shows static display when voting is disabled', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        isVotingEnabled={false}
      />
    );
    // Should render as div, not button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('indicates when user has voted', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        currentUser="user1"
        isAuthenticated={true}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-red-500');
  });

  it('calls onVote when clicked by authenticated user', async () => {
    const handleVote = vi.fn().mockResolvedValue(undefined);
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={[]}
        currentUser="voter"
        isAuthenticated={true}
        onVote={handleVote}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleVote).toHaveBeenCalledWith({
        author: 'author',
        permlink: 'test-post',
        weight: 10000,
      });
    });
  });

  it('calls onAuthRequired when unauthenticated user clicks', () => {
    const handleAuthRequired = vi.fn();
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        isAuthenticated={false}
        onAuthRequired={handleAuthRequired}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleAuthRequired).toHaveBeenCalled();
  });

  it('removes vote when user has already voted', async () => {
    const handleVote = vi.fn().mockResolvedValue(undefined);
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={[{ voter: 'voter', weight: 10000 }]}
        currentUser="voter"
        isAuthenticated={true}
        onVote={handleVote}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleVote).toHaveBeenCalledWith({
        author: 'author',
        permlink: 'test-post',
        weight: 0,
      });
    });
  });

  it('supports custom labels', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        labels={{ likes: 'upvotes' }}
      />
    );
    expect(screen.getByText(/upvotes/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <VoteButton
        author="author"
        permlink="test-post"
        activeVotes={mockVotes}
        isVotingEnabled={false}
        className="custom-class"
      />
    );
    const container = screen.getByText(/likes/).closest('div');
    expect(container).toHaveClass('custom-class');
  });
});
