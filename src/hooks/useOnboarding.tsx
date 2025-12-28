import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { toast } from 'sonner';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  action?: () => void;
  route?: string;
  checkCompleted?: () => Promise<boolean>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete seu perfil',
    description: 'Adicione sua foto e informações básicas',
    icon: 'User',
    xpReward: 50,
    route: '/perfil'
  },
  {
    id: 'first_client',
    title: 'Cadastre um cliente',
    description: 'Adicione seu primeiro cliente ao sistema',
    icon: 'Users',
    xpReward: 100,
    route: '/clientes'
  },
  {
    id: 'first_carrier',
    title: 'Cadastre uma transportadora',
    description: 'Adicione uma transportadora parceira',
    icon: 'Truck',
    xpReward: 100,
    route: '/transportadoras'
  },
  {
    id: 'first_delivery',
    title: 'Crie sua primeira entrega',
    description: 'Registre uma entrega no sistema',
    icon: 'Package',
    xpReward: 150,
    route: '/envios'
  },
  {
    id: 'explore_dashboard',
    title: 'Explore o dashboard',
    description: 'Conheça as métricas e indicadores',
    icon: 'LayoutDashboard',
    xpReward: 50,
    route: '/'
  },
  {
    id: 'notifications',
    title: 'Configure notificações',
    description: 'Personalize seus alertas',
    icon: 'Bell',
    xpReward: 75,
    route: '/notificacoes'
  }
];

export function useOnboarding() {
  const { user } = useAuth();
  const { addXP } = useGamification();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);

  // Fetch onboarding progress
  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Initialize onboarding for new users
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('user_onboarding')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      setShowWizard(true);
    }
  });

  // Complete a step
  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      if (!user?.id || !progress) throw new Error('User or progress not found');
      
      const step = ONBOARDING_STEPS.find(s => s.id === stepId);
      if (!step) throw new Error('Step not found');

      const newCompletedSteps = [...(progress.completed_steps || []), stepId];
      const newXpEarned = (progress.xp_earned || 0) + step.xpReward;
      const allCompleted = newCompletedSteps.length === ONBOARDING_STEPS.length;

      const { error } = await supabase
        .from('user_onboarding')
        .update({
          completed_steps: newCompletedSteps,
          current_step: newCompletedSteps.length,
          xp_earned: newXpEarned,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Award XP
      await addXP({ amount: step.xpReward, reason: 'onboarding' });
      
      return { stepId, xpEarned: step.xpReward, allCompleted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast.success(`+${data.xpEarned} XP conquistados!`, {
        description: data.allCompleted 
          ? '🎉 Parabéns! Você completou o onboarding!' 
          : 'Continue completando os passos!'
      });
    }
  });

  // Check if onboarding should be shown
  useEffect(() => {
    if (user?.id && !isLoading && progress === null) {
      initializeMutation.mutate();
    }
  }, [user?.id, isLoading, progress]);

  const completedSteps = progress?.completed_steps || [];
  const currentStepIndex = progress?.current_step || 0;
  const isCompleted = progress?.completed_at !== null;
  const progressPercentage = (completedSteps.length / ONBOARDING_STEPS.length) * 100;

  const isStepCompleted = useCallback((stepId: string) => {
    return completedSteps.includes(stepId);
  }, [completedSteps]);

  const completeStep = useCallback((stepId: string) => {
    if (!isStepCompleted(stepId)) {
      completeStepMutation.mutate(stepId);
    }
  }, [isStepCompleted, completeStepMutation]);

  const dismissWizard = useCallback(() => {
    setShowWizard(false);
  }, []);

  const openWizard = useCallback(() => {
    setShowWizard(true);
  }, []);

  return {
    steps: ONBOARDING_STEPS,
    completedSteps,
    currentStepIndex,
    isCompleted,
    progressPercentage,
    isStepCompleted,
    completeStep,
    showWizard,
    dismissWizard,
    openWizard,
    isLoading,
    totalXpEarned: progress?.xp_earned || 0
  };
}
