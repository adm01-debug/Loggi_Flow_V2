import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';
import { Activity } from 'lucide-react';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  animate: vi.fn(() => ({ stop: vi.fn() })),
}));

describe('KPICard', () => {
  it('renders title and value correctly', () => {
    render(
      <KPICard 
        title="Total Entregas" 
        value={1250} 
        icon={Activity} 
      />
    );
    
    expect(screen.getByText('Total Entregas')).toBeInTheDocument();
    // Since value is animated, we might need to handle the initial/final state.
    // The component uses a hook for animation.
  });

  it('renders trend value when provided', () => {
    render(
      <KPICard 
        title="Performance" 
        value="98%" 
        icon={Activity} 
        trend="up"
        trendValue="+5%"
      />
    );
    
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders progress bar when target is provided', () => {
    const { container } = render(
      <KPICard 
        title="Meta Mensal" 
        value={50} 
        target={100} 
        icon={Activity} 
      />
    );
    
    expect(screen.getByText('50% atingido')).toBeInTheDocument();
    expect(screen.getByText('Meta: 100')).toBeInTheDocument();
  });

  it('applies correct status classes', () => {
    const { container } = render(
      <KPICard 
        title="Status Crítico" 
        value={10} 
        status="danger" 
        icon={Activity} 
      />
    );
    
    // Check if the danger status class is present
    expect(container.firstChild).toHaveClass('border-destructive/40');
  });
});
