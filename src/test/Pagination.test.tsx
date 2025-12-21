import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/common/Pagination';

describe('Pagination', () => {
  const defaultProps = { currentPage: 1, totalPages: 5, pageSize: 10, totalItems: 50, onPageChange: vi.fn(), onPageSizeChange: vi.fn(), hasNextPage: true, hasPrevPage: false };

  it('should render current page info', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/1-10 de 50/)).toBeInTheDocument();
  });

  it('should call onPageChange when clicking next', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /próxima/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable prev button on first page', () => {
    render(<Pagination {...defaultProps} hasPrevPage={false} />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} hasNextPage={false} />);
    expect(screen.getByRole('button', { name: /próxima/i })).toBeDisabled();
  });
});
