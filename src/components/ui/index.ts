// ============================================
// UI COMPONENTS - CENTRALIZED EXPORTS
// ============================================

// Core Components (shadcn/ui base)
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { Switch } from './switch';
export { Badge, badgeVariants } from './badge';
export { Alert, AlertTitle, AlertDescription } from './alert';
export { Progress } from './progress';
export { Separator } from './separator';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// Layout Components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { AspectRatio } from './aspect-ratio';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

// Navigation
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from './breadcrumb';
export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from './navigation-menu';
export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from './pagination';
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarShortcut, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from './menubar';

// Overlays & Dialogs
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from './alert-dialog';
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet';
export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from './drawer';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup } from './context-menu';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, DropdownMenuPortal } from './dropdown-menu';

// Form Components
export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, useFormField } from './form';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './select';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Slider } from './slider';
export { Calendar } from './calendar';
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from './command';

// Data Display
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';
export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from './carousel';

// Sidebar (shadcn premium)
export { 
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, 
  SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, 
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar 
} from './sidebar';

// Skeletons
export { Skeleton, SkeletonPremium, CardSkeleton, TableRowSkeleton, TableSkeleton, StatCardSkeleton, StatsGridSkeleton, CardGridSkeleton, ChartSkeleton, FormSkeleton, ProfileSkeleton, ListItemSkeleton, NotificationSkeleton, SearchResultsSkeleton, DashboardSkeleton, PageSkeleton, FullPageSkeleton } from './skeletons';

// Animated
export { AnimatedNumber, FlipCounter, AnimatedProgressRing } from './animated-number';

// Micro-interactions
export { 
  RippleContainer, 
  StaggerContainer, 
  StaggerItem, 
  FadeIn, 
  ScaleHover, 
  Floating, 
  PulseGlow, 
  AnimatedCounter, 
  Shake, 
  Typewriter, 
  Reveal,



// Chart (recharts wrapper)
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle } from './chart';

// Toast
export { Toaster } from './toaster';
export { useToast, toast } from './use-toast';
