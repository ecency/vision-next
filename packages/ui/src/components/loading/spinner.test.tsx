import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });

  it('supports custom label', () => {
    render(<Spinner label="Please wait" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Please wait');
  });

  it('renders with correct size classes', () => {
    const { rerender } = render(<Spinner size="small" />);
    let svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');

    rerender(<Spinner size="large" />);
    svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');

    rerender(<Spinner size="xlarge" />);
    svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('w-12', 'h-12');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('has animation class', () => {
    render(<Spinner />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('contains screen reader text', () => {
    render(<Spinner label="Loading content" />);
    expect(screen.getByText('Loading content')).toHaveClass('sr-only');
  });
});
