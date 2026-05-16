import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Truck, Package, MapPin, Star, TrendingUp, Zap, BarChart3, Award, Users, ShieldCheck, Shield, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Floating } from "@/components/ui/micro-interactions";
import { AnimatedNumber } from "@/components/ui/animated-number";

// Feature highlights for hero section
const features = [
  { icon: TrendingUp, title: "Otimize Operações", description: "Reduza custos em até 30%" },
  { icon: Zap, title: "Tempo Real", description: "Rastreamento instantâneo" },
  { icon: Award, title: "Gamificação", description: "Engaje sua equipe" },
  { icon: BarChart3, title: "Analytics", description: "Insights poderosos" },
];

const testimonials = [
  { name: "Carlos Silva", role: "Gerente de Logística", company: "TransLog BR", avatar: "CS", content: "Reduzimos 40% do tempo de gestão com o LogiFlow. A gamificação transformou nossa equipe!", rating: 5 },
  { name: "Ana Beatriz", role: "Diretora de Operações", company: "Express Cargo", avatar: "AB", content: "A visibilidade em tempo real mudou completamente nossa operação. Recomendo demais!", rating: 5 },
  { name: "Roberto Mendes", role: "CEO", company: "FastShip", avatar: "RM", content: "ROI positivo em 3 meses. A melhor decisão que tomamos para nossa logística.", rating: 5 },
  { name: "Fernanda Costa", role: "Coordenadora", company: "LogiMaster", avatar: "FC", content: "Interface intuitiva e relatórios detalhados. Perfeito para gestão de frotas!", rating: 5 },
  { name: "Pedro Santos", role: "Diretor de TI", company: "RápidoLog", avatar: "PS", content: "Integração perfeita com nossos sistemas. Suporte excepcional!", rating: 5 },
];

const stats = [
  { value: 10000, label: "Entregas/mês", prefix: "", suffix: "+", decimals: undefined as number | undefined },
  { value: 98.5, label: "Satisfação", prefix: "", suffix: "%", decimals: 1 },
  { value: 150, label: "Empresas", prefix: "", suffix: "+" },
  { value: 35, label: "Redução Custos", prefix: "-", suffix: "%" },
];

const trustBadges = [
  { name: "ISO 27001", icon: ShieldCheck },
  { name: "LGPD Compliant", icon: Shield },
  { name: "99.9% Uptime", icon: Globe },
  { name: "Suporte 24/7", icon: Users },
];

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", top: "-20%", right: "-10%" }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", bottom: "-15%", left: "-5%" }}
        animate={{ scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {[...Array(8)].map((_, i) => (
        <Floating key={i} duration={4 + i * 0.5} distance={20 + i * 3}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.07 }} transition={{ delay: i * 0.15 }} className="absolute" style={{ left: `${5 + i * 12}%`, top: `${15 + (i % 4) * 20}%` }}>
            {i % 4 === 0 && <Truck className="w-10 h-10 text-primary" />}
            {i % 4 === 1 && <Package className="w-8 h-8 text-primary" />}
            {i % 4 === 2 && <MapPin className="w-9 h-9 text-primary" />}
            {i % 4 === 3 && <Box className="w-7 h-7 text-primary" />}
          </motion.div>
        </Floating>
      ))}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
    </div>
  );
}

function TestimonialCard({ testimonial, isActive }: { testimonial: typeof testimonials[0]; isActive?: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -5 }} className={`bg-card/60 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 h-full ${isActive ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/50 hover:border-primary/30'}`}>
      <div className="flex items-start gap-4 mb-4">
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">{testimonial.avatar}</motion.div>
        <div className="flex-1">
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          <p className="text-xs text-primary font-medium">{testimonial.company}</p>
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-4 italic">"{testimonial.content}"</p>
      <div className="flex gap-1">
        {[...Array(testimonial.rating)].map((_, i) => (
          <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: i * 0.1, type: "spring" }}>
            <Star className="w-4 h-4 fill-warning text-warning" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setIsVisible(true), 800 + index * 200); return () => clearTimeout(timer); }, [index]);
  return (
    <motion.div className="text-center group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.15 }} whileHover={{ scale: 1.05 }}>
      <div className="text-2xl xl:text-3xl font-display font-bold gradient-text tabular-nums">
        {isVisible ? <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={1.5} formatValue={(v) => stat.decimals ? v.toFixed(stat.decimals) : v.toLocaleString('pt-BR')} /> : <span className="opacity-0">{stat.prefix}0{stat.suffix}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">{stat.label}</p>
    </motion.div>
  );
}

export function AuthHeroSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-8 xl:p-12 relative z-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }} transition={{ duration: 0.5 }} className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
            <Truck className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <span className="font-display text-2xl font-bold">LogiFlow</span>
        </div>
        <p className="text-muted-foreground">Logística Gamificada • Resultados Reais</p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center max-w-xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="space-y-6">
          <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
            Transforme sua <span className="gradient-text">logística</span> em uma experiência <span className="gradient-text">gamificada</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Aumente a produtividade da sua equipe em até 40% com rastreamento em tempo real, analytics avançados e sistema de recompensas que motiva e engaja.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} whileHover={{ scale: 1.03, y: -2 }} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30 hover:border-primary/30 transition-all cursor-default">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><feature.icon className="w-4.5 h-4.5 text-primary" /></div>
                <div><p className="font-medium text-sm">{feature.title}</p><p className="text-xs text-muted-foreground">{feature.description}</p></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex gap-8 pt-10">
          {stats.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="flex flex-wrap gap-2 pt-8">
          {trustBadges.map((badge, i) => (
            <motion.div key={badge.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5 + i * 0.1 }} whileHover={{ scale: 1.1, y: -2 }} className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/50 border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default">
              <badge.icon className="w-3.5 h-3.5 text-primary" /><span>{badge.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /><span>O que nossos clientes dizem</span></div>
          <div className="flex gap-1">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial ? 'bg-primary w-4' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} />
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentTestimonial} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="grid grid-cols-1">
              <TestimonialCard testimonial={testimonials[currentTestimonial]} isActive={true} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </motion.div>
    </div>
  );
}
