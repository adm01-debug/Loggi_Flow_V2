import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Package, 
  Truck, 
  BarChart3, 
  Menu,
  X,
  Bell,
  Settings,
  Trophy,
  Users,
  FileText,
  Map,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Package, label: 'Entregas', path: '/envios' },
  { icon: Truck, label: 'Coletas', path: '/coletas' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Menu, label: 'Menu', path: 'menu' }
];

const menuItems: NavItem[] = [
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Truck, label: 'Transportadoras', path: '/transportadoras' },
  { icon: Map, label: 'Rotas', path: '/rotas-transportadoras' },
  { icon: Wallet, label: 'Financeiro', path: '/conciliacao-financeira' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: Trophy, label: 'Conquistas', path: '/conquistas' },
  { icon: Bell, label: 'Notificações', path: '/notificacoes' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' }
];

export function MobileBottomNavPremium() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const index = mainNavItems.findIndex(item => 
      item.path !== 'menu' && location.pathname === item.path
    );
    if (index !== -1) setActiveIndex(index);
  }, [location.pathname]);

  if (!isMobile) return null;

  const handleNavClick = (item: NavItem, index: number) => {
    if (item.path === 'menu') {
      setIsMenuOpen(!isMenuOpen);
    } else {
      setActiveIndex(index);
      navigate(item.path);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-2xl 
                         shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Menu</h3>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {menuItems.map((item) => (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl 
                   border-t border-border safe-area-bottom"
      >
        <div className="relative flex items-center justify-around h-16 px-2">
          {/* Active indicator background */}
          <motion.div
            layoutId="activeTab"
            className="absolute h-12 bg-primary/10 rounded-2xl -z-10"
            style={{ width: `${100 / mainNavItems.length - 4}%` }}
            animate={{
              x: `${activeIndex * 100}%`,
              left: `${2}%`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {mainNavItems.map((item, index) => {
            const isActive = item.path === 'menu' 
              ? isMenuOpen 
              : location.pathname === item.path;

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavClick(item, index)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full",
                  "transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <item.icon className="w-6 h-6" />
                </motion.div>
                
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    y: isActive ? 0 : 2
                  }}
                  className="text-[10px] font-medium mt-1"
                >
                  {item.label}
                </motion.span>

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 bg-destructive 
                                   text-destructive-foreground text-[10px] font-bold 
                                   rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}

                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && item.path !== 'menu' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Spacer para evitar sobreposição do conteúdo */}
      <div className="h-16 md:hidden" />
    </>
  );
}
