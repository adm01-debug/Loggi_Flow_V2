import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActions } from '@/components/common/BulkActions';
import { Trash2 } from 'lucide-react';

describe('BulkActions', () => {
  const defaultProps = { selectedIds: ['1', '2'], totalCount: 10, onClearSelection: vi.fn(), onSelectAll: vi.fn(), actions: [{ id: 'delete', label: 'Excluir', icon: Trash2, onClick: vi.fn() }] };

  it('should show selected count', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText(/2 selecionado/i)).toBeInTheDocument();
  });

  it('should call onClearSelection when clicking clear', () => {
    const onClearSelection = vi.fn();
    render(<BulkActions {...defaultProps} onClearSelection={onClearSelection} />);
    fireEvent.click(screen.getByText(/Limpar/i));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it('should render action buttons', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });
});
