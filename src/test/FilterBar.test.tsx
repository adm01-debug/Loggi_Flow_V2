import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '@/components/common/FilterBar';

describe('FilterBar', () => {
  const defaultProps = { searchValue: '', onSearchChange: vi.fn(), searchPlaceholder: 'Buscar...', filters: [], onClearFilters: vi.fn(), hasActiveFilters: false, totalCount: 100, filteredCount: 100 };

  it('should render search input', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('should call onSearchChange when typing', () => {
    const onSearchChange = vi.fn();
    render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar...'), { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  it('should show clear button when hasActiveFilters', () => {
    render(<FilterBar {...defaultProps} hasActiveFilters={true} />);
    expect(screen.getByText(/Limpar/i)).toBeInTheDocument();
  });

  it('should call onClearFilters when clicking clear', () => {
    const onClearFilters = vi.fn();
    render(<FilterBar {...defaultProps} hasActiveFilters={true} onClearFilters={onClearFilters} />);
    fireEvent.click(screen.getByText(/Limpar/i));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
