import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserAvatar } from './index';

describe('UserAvatar', () => {
  it('renders with default props', () => {
    render(<UserAvatar username="testuser" />);
    const avatar = screen.getByRole('img', { name: "testuser's avatar" });
    expect(avatar).toBeInTheDocument();
  });

  it('renders with correct size classes', () => {
    const { rerender } = render(<UserAvatar username="testuser" size="small" />);
    let avatar = screen.getByRole('img');
    expect(avatar).toHaveClass('w-6', 'h-6');

    rerender(<UserAvatar username="testuser" size="large" />);
    avatar = screen.getByRole('img');
    expect(avatar).toHaveClass('w-20', 'h-20');
  });

  it('renders as button when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<UserAvatar username="testuser" onClick={handleClick} />);
    const avatar = screen.getByRole('button', { name: "testuser's avatar" });
    expect(avatar).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<UserAvatar username="testuser" onClick={handleClick} />);
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<UserAvatar username="testuser" onClick={handleClick} />);
    const avatar = screen.getByRole('button');

    fireEvent.keyDown(avatar, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(avatar, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('uses custom image proxy base', () => {
    render(<UserAvatar username="testuser" imageProxyBase="https://custom-proxy.com" />);
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({
      backgroundImage: expect.stringContaining('custom-proxy.com'),
    });
  });

  it('applies custom className', () => {
    render(<UserAvatar username="testuser" className="custom-class" />);
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveClass('custom-class');
  });

  it('uses custom src when provided', () => {
    render(<UserAvatar username="testuser" src="https://example.com/avatar.png" />);
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({
      backgroundImage: 'url(https://example.com/avatar.png)',
    });
  });
});
