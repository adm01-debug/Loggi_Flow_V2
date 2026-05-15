import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Sparkles, AlertCircle, TrendingUp, Zap, MessageSquare, PanelRightClose, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-logistics-assistant`;

export function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = useCallback(async (
    userMessage: string,
    conversationHistory: Message[]
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        userId: user?.id,
        conversationHistory: conversationHistory.slice(-10),
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Limite de requisições atingido.");
      throw new Error("Erro ao processar mensagem estratégica.");
    }

    if (!resp.body) throw new Error("Stream não disponível");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = "";

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantContent;
                return newMessages;
              });
            }
          } catch (e) { /* ignore chunk error */ }
        }
      }
    }

    return assistantContent;
  }, [user?.id]);

  const sendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;

    if (!text) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      await streamChat(userMessage, messages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na IA');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, a inteligência está ocupada. Tente novamente em instantes.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const quickActions = [
    { label: "Analisar Atrasos", icon: <AlertCircle className="h-3 w-3" />, query: "Analise todas as entregas com risco de atraso agora." },
    { label: "Otimizar Custos", icon: <TrendingUp className="h-3 w-3" />, query: "Como posso reduzir o custo de frete este mês?" },
    { label: "Melhor Transportadora", icon: <Zap className="h-3 w-3" />, query: "Qual transportadora tem melhor SLA atual?" },
  ];

  if (isMinimized) {
    return (
      <Button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl animate-in zoom-in-50"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-primary/5 p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              Logi-GPT <Badge variant="secondary" className="h-4 text-[10px] px-1 bg-primary/20 text-primary border-none">V5.0 ELITE</Badge>
            </h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Gemini 2.0 Flash Ativo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar histórico</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Insights Bar */}
      <div className="flex gap-2 p-2 border-b bg-muted/30 overflow-x-auto no-scrollbar">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] whitespace-nowrap gap-1.5 px-2 bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
            onClick={() => sendMessage(action.query)}
            disabled={isLoading}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
              <Bot className="h-16 w-16 text-primary relative" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold">Bem-vindo, Operador de Elite</h4>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Estou monitorando o dashboard em tempo real. Como posso otimizar sua logística hoje?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-2 text-xs h-9 bg-muted/20"
                onClick={() => setInput("Quais são os alertas críticos agora?")}
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Alertas críticos agora?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-2 text-xs h-9 bg-muted/20"
                onClick={() => setInput("Previsão de trânsito para hoje?")}
              >
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                Previsão de trânsito para hoje?
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-2",
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-1.5 px-1">
                  {msg.role === 'assistant' ? (
                    <Bot className="h-3 w-3 text-primary" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {msg.role === 'user' ? 'Você' : 'Logi-GPT'}
                  </span>
                </div>
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted/50 border border-border/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:text-foreground prose-strong:text-foreground'
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-1.5 px-1">
                  <Bot className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pensando...</span>
                </div>
                <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Footer / Input */}
      <div className="p-4 bg-muted/20 border-t space-y-3">
        <div className="relative group">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Comando de voz ou texto..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            className="pr-12 h-11 bg-background border-muted-foreground/20 focus-visible:ring-primary shadow-inner"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={isLoading || !input.trim()}
            size="icon"
            className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <Terminal className="h-3 w-3" />
          Modo Seguro: IA com contexto restrito à operação atual.
        </p>
      </div>
    </div>
  );
}
