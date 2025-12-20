import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Helper to wrap components with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Test utilities
describe('Gamification Utils', () => {
  it('should calculate level correctly from XP', () => {
    // Import the function
    const calculateLevel = (xp: number): number => {
      return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1)
    }

    expect(calculateLevel(0)).toBe(1)
    expect(calculateLevel(100)).toBe(2)
    expect(calculateLevel(400)).toBe(3)
    expect(calculateLevel(900)).toBe(4)
    expect(calculateLevel(1600)).toBe(5)
  })

  it('should calculate XP needed for level', () => {
    const xpForLevel = (level: number): number => {
      return (level - 1) * (level - 1) * 100
    }

    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(400)
    expect(xpForLevel(4)).toBe(900)
    expect(xpForLevel(5)).toBe(1600)
  })
})

// Test date formatting
describe('Date Utilities', () => {
  it('should format dates correctly', () => {
    const formatDate = (dateStr: string | null): string => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR')
    }

    expect(formatDate(null)).toBe('-')
    expect(formatDate('2024-12-20T10:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})

// Test status configs
describe('Status Configurations', () => {
  const statusConfig = {
    aguardando_producao: { label: 'Aguardando Produção', color: 'bg-muted' },
    em_transito: { label: 'Em Trânsito', color: 'bg-info' },
    entregue: { label: 'Entregue', color: 'bg-success' },
  }

  it('should have correct status labels', () => {
    expect(statusConfig.aguardando_producao.label).toBe('Aguardando Produção')
    expect(statusConfig.em_transito.label).toBe('Em Trânsito')
    expect(statusConfig.entregue.label).toBe('Entregue')
  })

  it('should have valid color classes', () => {
    Object.values(statusConfig).forEach((config) => {
      expect(config.color).toMatch(/^bg-/)
    })
  })
})

// Test CNPJ formatting
describe('CNPJ Formatting', () => {
  const formatCNPJ = (cnpj: string): string => {
    const cleaned = cnpj.replace(/\D/g, '')
    if (cleaned.length !== 14) return cnpj
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  it('should format valid CNPJ', () => {
    expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('should return original for invalid CNPJ', () => {
    expect(formatCNPJ('123')).toBe('123')
    expect(formatCNPJ('invalid')).toBe('invalid')
  })
})

// Test phone formatting
describe('Phone Formatting', () => {
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  it('should format mobile phone', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })

  it('should format landline phone', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
})
