import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('is hidden from screen readers', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies width and height classes', () => {
    render(<Skeleton width="w-32" height="h-8" />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('w-32', 'h-8');
  });

  it('applies rounded classes', () => {
    const { rerender } = render(<Skeleton rounded="sm" />);
    let skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('rounded-sm');

    rerender(<Skeleton rounded="full" />);
    skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('rounded-full');

    rerender(<Skeleton rounded={false} />);
    skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).not.toHaveClass('rounded');
  });

  it('renders multiple skeletons', () => {
    render(<Skeleton count={3} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('adds margin between multiple skeletons', () => {
    render(<Skeleton count={3} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons[0]).toHaveClass('mb-2');
    expect(skeletons[1]).toHaveClass('mb-2');
    expect(skeletons[2]).not.toHaveClass('mb-2');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('has correct background colors for dark mode', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-200', 'dark:bg-gray-700');
  });
});
