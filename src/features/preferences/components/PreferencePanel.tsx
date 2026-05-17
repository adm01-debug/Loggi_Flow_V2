import { 
  Settings2, 
  Monitor, 
  Moon, 
  Sun, 
  Layout, 
  Maximize, 
  Minimize, 
  Eye,
  Type,
  Move,
  Zap,
  Volume2
} from "lucide-react";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/utils/haptics";

export function PreferencePanel() {
  const { preferences, updatePreference, updateAccessibility, updateGamification } = useUserPreferences();

  return (
    <div className="space-y-8 p-1">
      {/* Theme Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold uppercase tracking-widest">Interface</h4>
        </div>
        
        <div className="grid gap-6">
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase font-black">Tema do Sistema</Label>
          <Tabs 
            value={preferences.theme} 
            onValueChange={(v: any) => {
              hapticFeedback('light');
              updatePreference('theme', v);
            }}
            className="w-full"
          >
              <TabsList className="grid grid-cols-3 w-full h-12 p-1 bg-muted/50 border border-white/5">
                <TabsTrigger value="light" className="gap-2">
                  <Sun className="w-4 h-4" /> <span className="hidden sm:inline">Claro</span>
                </TabsTrigger>
                <TabsTrigger value="dark" className="gap-2">
                  <Moon className="w-4 h-4" /> <span className="hidden sm:inline">Escuro</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-2">
                  <Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Auto</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase font-black">Densidade Visual</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact', icon: Minimize, label: 'Compacto' },
                { id: 'standard', icon: Layout, label: 'Padrão' },
                { id: 'comfortable', icon: Maximize, label: 'Amplo' }
              ].map((d) => (
                <Button
                  key={d.id}
                  variant={preferences.density === d.id ? "default" : "outline"}
                  className="flex-col h-20 gap-2 text-[10px] font-bold uppercase"
                  onClick={() => {
                    hapticFeedback('medium');
                    updatePreference('density', d.id as any);
                  }}
                >
                  <d.icon className="w-5 h-5" />
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold uppercase tracking-widest">Acessibilidade</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Alto Contraste</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Melhora visibilidade de textos</p>
              </div>
            </div>
            <Switch 
              checked={preferences.accessibility.highContrast}
              onCheckedChange={(v) => updateAccessibility('highContrast', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Move className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Reduzir Movimento</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Desativa animações intensas</p>
              </div>
            </div>
            <Switch 
              checked={preferences.accessibility.reducedMotion}
              onCheckedChange={(v) => updateAccessibility('reducedMotion', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Type className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-1 w-full">
                <p className="text-sm font-bold">Escala de Fonte</p>
                <Select 
                  value={preferences.accessibility.fontSize}
                  onValueChange={(v: any) => updateAccessibility('fontSize', v)}
                >
                  <SelectTrigger className="h-8 text-xs font-bold bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Pequeno (90%)</SelectItem>
                    <SelectItem value="md">Médio (100%)</SelectItem>
                    <SelectItem value="lg">Grande (115%)</SelectItem>
                    <SelectItem value="xl">Extra (130%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold uppercase tracking-widest">Gamificação</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Efeitos de Partículas</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Visual tático avançado</p>
            </div>
            <Switch 
              checked={preferences.gamification.showParticles}
              onCheckedChange={(v) => updateGamification('showParticles', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Efeitos Sonoros</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Feedback auditivo de conquistas</p>
            </div>
            <Switch 
              checked={preferences.gamification.soundEffects}
              onCheckedChange={(v) => updateGamification('soundEffects', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Velocidade de Animação</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Ritmo da interface Nexus</p>
            </div>
            <div className="w-32">
              <Select 
                value={(preferences.gamification as any).animationSpeed || 'normal'}
                onValueChange={(v) => updateGamification('animationSpeed' as any, v)}
              >
                <SelectTrigger className="h-8 text-[10px] font-black uppercase bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10">
                  <SelectItem value="fast" className="text-[10px] font-bold uppercase tracking-tighter">Instantâneo</SelectItem>
                  <SelectItem value="normal" className="text-[10px] font-bold uppercase tracking-tighter">Equilibrado</SelectItem>
                  <SelectItem value="smooth" className="text-[10px] font-bold uppercase tracking-tighter">Cinematográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-white/5">
            <Label className="text-xs text-muted-foreground uppercase font-black">Cor de Destaque (Accent)</Label>
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Nexus Red', color: '#ea384c' },
                { name: 'Cyber Blue', color: '#0ea5e9' },
                { name: 'Emerald', color: '#10b981' },
                { name: 'Amber', color: '#f59e0b' },
                { name: 'Violet', color: '#8b5cf6' },
                { name: 'Gold', color: '#FFD700' }
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => updateGamification('accentColor', c.color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all duration-500",
                    preferences.gamification.accentColor === c.color ? "border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
