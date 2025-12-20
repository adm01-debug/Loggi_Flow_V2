export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          code: string
          coins_reward: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          coins_reward?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          coins_reward?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      alertas_custo: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          estado_destino: string | null
          id: string
          limite_mensal: number
          limite_por_entrega: number | null
          notificar_percentual: number
          tipo: string
          transportadora_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          estado_destino?: string | null
          id?: string
          limite_mensal: number
          limite_por_entrega?: number | null
          notificar_percentual?: number
          tipo: string
          transportadora_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          estado_destino?: string | null
          id?: string
          limite_mensal?: number
          limite_por_entrega?: number | null
          notificar_percentual?: number
          tipo?: string
          transportadora_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_custo_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          endereco_completo: string
          estado: string | null
          horario_entrega: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          restricoes_entrega: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          endereco_completo: string
          estado?: string | null
          horario_entrega?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          restricoes_entrega?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          endereco_completo?: string
          estado?: string | null
          horario_entrega?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          restricoes_entrega?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coletas: {
        Row: {
          codigo_rastreamento: string | null
          comprovante_coleta_url: string | null
          contato_coleta: string | null
          created_at: string
          data_efetiva_coleta: string | null
          data_prevista_coleta: string | null
          data_recebimento: string | null
          divergencia_percentual: number | null
          endereco_coleta: string
          fornecedor_id: string | null
          id: string
          link_rastreamento: string | null
          nf_anexo_url: string | null
          nf_fornecedor: string | null
          numero_coleta: string
          observacoes: string | null
          peso_estimado_kg: number | null
          qtd_recebida: number | null
          qtd_volumes: number | null
          responsavel_recebimento: string | null
          status: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id: string | null
          updated_at: string
        }
        Insert: {
          codigo_rastreamento?: string | null
          comprovante_coleta_url?: string | null
          contato_coleta?: string | null
          created_at?: string
          data_efetiva_coleta?: string | null
          data_prevista_coleta?: string | null
          data_recebimento?: string | null
          divergencia_percentual?: number | null
          endereco_coleta: string
          fornecedor_id?: string | null
          id?: string
          link_rastreamento?: string | null
          nf_anexo_url?: string | null
          nf_fornecedor?: string | null
          numero_coleta: string
          observacoes?: string | null
          peso_estimado_kg?: number | null
          qtd_recebida?: number | null
          qtd_volumes?: number | null
          responsavel_recebimento?: string | null
          status?: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta?: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Update: {
          codigo_rastreamento?: string | null
          comprovante_coleta_url?: string | null
          contato_coleta?: string | null
          created_at?: string
          data_efetiva_coleta?: string | null
          data_prevista_coleta?: string | null
          data_recebimento?: string | null
          divergencia_percentual?: number | null
          endereco_coleta?: string
          fornecedor_id?: string | null
          id?: string
          link_rastreamento?: string | null
          nf_anexo_url?: string | null
          nf_fornecedor?: string | null
          numero_coleta?: string
          observacoes?: string | null
          peso_estimado_kg?: number | null
          qtd_recebida?: number | null
          qtd_volumes?: number | null
          responsavel_recebimento?: string | null
          status?: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta?: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coletas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cotacoes_frete: {
        Row: {
          created_at: string
          entrega_id: string
          id: string
          observacoes: string | null
          prazo_dias: number | null
          selecionada: boolean | null
          transportadora_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          entrega_id: string
          id?: string
          observacoes?: string | null
          prazo_dias?: number | null
          selecionada?: boolean | null
          transportadora_id: string
          valor: number
        }
        Update: {
          created_at?: string
          entrega_id?: string
          id?: string
          observacoes?: string | null
          prazo_dias?: number | null
          selecionada?: boolean | null
          transportadora_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_frete_entrega_id_fkey"
            columns: ["entrega_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_frete_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          box_alocado: string | null
          cliente_id: string | null
          codigo_rastreamento: string | null
          comprovante_entrega_url: string | null
          contato_cliente: string | null
          created_at: string
          data_despacho: string | null
          data_entrega_efetiva: string | null
          endereco_entrega: string
          geocoded_at: string | null
          id: string
          latitude: number | null
          link_rastreamento: string | null
          longitude: number | null
          nf_remessa: string | null
          nf_remessa_url: string | null
          numero_entrega: string
          observacoes: string | null
          previsao_entrega: string | null
          recebedor: string | null
          status: Database["public"]["Enums"]["entrega_status"]
          tipo_frete: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id: string | null
          updated_at: string
          valor_frete: number | null
        }
        Insert: {
          box_alocado?: string | null
          cliente_id?: string | null
          codigo_rastreamento?: string | null
          comprovante_entrega_url?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_despacho?: string | null
          data_entrega_efetiva?: string | null
          endereco_entrega: string
          geocoded_at?: string | null
          id?: string
          latitude?: number | null
          link_rastreamento?: string | null
          longitude?: number | null
          nf_remessa?: string | null
          nf_remessa_url?: string | null
          numero_entrega: string
          observacoes?: string | null
          previsao_entrega?: string | null
          recebedor?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          tipo_frete?: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number | null
        }
        Update: {
          box_alocado?: string | null
          cliente_id?: string | null
          codigo_rastreamento?: string | null
          comprovante_entrega_url?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_despacho?: string | null
          data_entrega_efetiva?: string | null
          endereco_entrega?: string
          geocoded_at?: string | null
          id?: string
          latitude?: number | null
          link_rastreamento?: string | null
          longitude?: number | null
          nf_remessa?: string | null
          nf_remessa_url?: string | null
          numero_entrega?: string
          observacoes?: string | null
          previsao_entrega?: string | null
          recebedor?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          tipo_frete?: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          endereco_completo: string
          estado: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          endereco_completo: string
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          endereco_completo?: string
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      fretes_internos: {
        Row: {
          created_at: string
          data_entrega_efetiva: string | null
          destino: string
          id: string
          motorista: string | null
          observacoes: string | null
          origem: string
          previsao_entrega: string | null
          quantidade_itens: number
          status: Database["public"]["Enums"]["frete_interno_status"]
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          data_entrega_efetiva?: string | null
          destino: string
          id?: string
          motorista?: string | null
          observacoes?: string | null
          origem: string
          previsao_entrega?: string | null
          quantidade_itens?: number
          status?: Database["public"]["Enums"]["frete_interno_status"]
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          data_entrega_efetiva?: string | null
          destino?: string
          id?: string
          motorista?: string | null
          observacoes?: string | null
          origem?: string
          previsao_entrega?: string | null
          quantidade_itens?: number
          status?: Database["public"]["Enums"]["frete_interno_status"]
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      notificacoes_custo: {
        Row: {
          alerta_id: string | null
          created_at: string
          id: string
          lida: boolean
          limite: number
          mensagem: string
          percentual_atingido: number
          tipo_notificacao: string
          valor_atual: number
        }
        Insert: {
          alerta_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          limite: number
          mensagem: string
          percentual_atingido: number
          tipo_notificacao: string
          valor_atual: number
        }
        Update: {
          alerta_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          limite?: number
          mensagem?: string
          percentual_atingido?: number
          tipo_notificacao?: string
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_custo_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      ocorrencias: {
        Row: {
          acao_tomada: string | null
          coleta_id: string | null
          created_at: string
          data_resolucao: string | null
          descricao: string | null
          entrega_id: string | null
          fotos_urls: string[] | null
          id: string
          resolvida: boolean | null
          tipo_ocorrencia: string
        }
        Insert: {
          acao_tomada?: string | null
          coleta_id?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao?: string | null
          entrega_id?: string | null
          fotos_urls?: string[] | null
          id?: string
          resolvida?: boolean | null
          tipo_ocorrencia: string
        }
        Update: {
          acao_tomada?: string | null
          coleta_id?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao?: string | null
          entrega_id?: string | null
          fotos_urls?: string[] | null
          id?: string
          resolvida?: boolean | null
          tipo_ocorrencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_entrega_id_fkey"
            columns: ["entrega_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rastreamento_alertas: {
        Row: {
          alert_type: string
          coleta_id: string | null
          created_at: string
          id: string
          lalamove_order_id: string
          latitude: number | null
          longitude: number | null
          message: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          coleta_id?: string | null
          created_at?: string
          id?: string
          lalamove_order_id: string
          latitude?: number | null
          longitude?: number | null
          message: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
        }
        Update: {
          alert_type?: string
          coleta_id?: string | null
          created_at?: string
          id?: string
          lalamove_order_id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreamento_alertas_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
        ]
      }
      rastreamento_historico: {
        Row: {
          coleta_id: string | null
          created_at: string
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          driver_plate: string | null
          id: string
          lalamove_order_id: string
          latitude: number
          longitude: number
          order_status: string | null
          recorded_at: string
        }
        Insert: {
          coleta_id?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_plate?: string | null
          id?: string
          lalamove_order_id: string
          latitude: number
          longitude: number
          order_status?: string | null
          recorded_at?: string
        }
        Update: {
          coleta_id?: string | null
          created_at?: string
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_plate?: string | null
          id?: string
          lalamove_order_id?: string
          latitude?: number
          longitude?: number
          order_status?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreamento_historico_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_items: {
        Row: {
          available: boolean
          category: string
          coins_cost: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          stock: number | null
        }
        Insert: {
          available?: boolean
          category?: string
          coins_cost?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          rarity?: string
          stock?: number | null
        }
        Update: {
          available?: boolean
          category?: string
          coins_cost?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          stock?: number | null
        }
        Relationships: []
      }
      reward_purchases: {
        Row: {
          coins_spent: number
          created_at: string
          id: string
          redeemed_at: string | null
          reward_item_id: string
          status: string
          user_id: string
        }
        Insert: {
          coins_spent: number
          created_at?: string
          id?: string
          redeemed_at?: string | null
          reward_item_id: string
          status?: string
          user_id: string
        }
        Update: {
          coins_spent?: number
          created_at?: string
          id?: string
          redeemed_at?: string | null
          reward_item_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_purchases_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_frete: {
        Row: {
          ativo: boolean
          created_at: string
          estado_destino: string
          id: string
          peso_max_kg: number
          peso_min_kg: number
          prazo_dias: number
          preco_por_kg: number
          regiao_destino: string
          taxa_fixa: number
          transportadora_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          estado_destino: string
          id?: string
          peso_max_kg?: number
          peso_min_kg?: number
          prazo_dias?: number
          preco_por_kg: number
          regiao_destino: string
          taxa_fixa?: number
          transportadora_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          estado_destino?: string
          id?: string
          peso_max_kg?: number
          peso_min_kg?: number
          prazo_dias?: number
          preco_por_kg?: number
          regiao_destino?: string
          taxa_fixa?: number
          transportadora_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_frete_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      transportadoras: {
        Row: {
          api_disponivel: boolean | null
          cnpj: string
          contato_comercial: string
          created_at: string
          data_homologacao: string | null
          email_comercial: string
          homologada: boolean | null
          id: string
          nome_fantasia: string
          observacoes: string | null
          prazo_medio_dias: number | null
          razao_social: string
          regioes_atendidas: string[] | null
          score_performance: number | null
          updated_at: string
          url_rastreamento: string | null
          whatsapp_operacional: string | null
        }
        Insert: {
          api_disponivel?: boolean | null
          cnpj: string
          contato_comercial: string
          created_at?: string
          data_homologacao?: string | null
          email_comercial: string
          homologada?: boolean | null
          id?: string
          nome_fantasia: string
          observacoes?: string | null
          prazo_medio_dias?: number | null
          razao_social: string
          regioes_atendidas?: string[] | null
          score_performance?: number | null
          updated_at?: string
          url_rastreamento?: string | null
          whatsapp_operacional?: string | null
        }
        Update: {
          api_disponivel?: boolean | null
          cnpj?: string
          contato_comercial?: string
          created_at?: string
          data_homologacao?: string | null
          email_comercial?: string
          homologada?: boolean | null
          id?: string
          nome_fantasia?: string
          observacoes?: string | null
          prazo_medio_dias?: number | null
          razao_social?: string
          regioes_atendidas?: string[] | null
          score_performance?: number | null
          updated_at?: string
          url_rastreamento?: string | null
          whatsapp_operacional?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          coins: number
          created_at: string
          current_xp: number
          id: string
          last_activity_date: string | null
          level: number
          streak_days: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          current_xp?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          current_xp?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      xp_for_level: { Args: { lvl: number }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      coleta_status:
        | "aguardando_liberacao"
        | "solicitada"
        | "em_transito"
        | "chegou_expedicao"
        | "conferencia_ok"
        | "divergencia"
        | "finalizada"
      coleta_tipo: "lalamove" | "transportadora"
      entrega_status:
        | "aguardando_producao"
        | "pronto_despacho"
        | "cotacao_frete"
        | "nf_emitida"
        | "despachado"
        | "em_transito"
        | "saiu_entrega"
        | "entregue"
        | "ocorrencia"
        | "finalizado"
      frete_interno_status:
        | "pendente"
        | "em_transito"
        | "entregue"
        | "atrasado"
        | "cancelado"
      frete_tipo: "cif" | "fob" | "cortesia"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "achievement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      coleta_status: [
        "aguardando_liberacao",
        "solicitada",
        "em_transito",
        "chegou_expedicao",
        "conferencia_ok",
        "divergencia",
        "finalizada",
      ],
      coleta_tipo: ["lalamove", "transportadora"],
      entrega_status: [
        "aguardando_producao",
        "pronto_despacho",
        "cotacao_frete",
        "nf_emitida",
        "despachado",
        "em_transito",
        "saiu_entrega",
        "entregue",
        "ocorrencia",
        "finalizado",
      ],
      frete_interno_status: [
        "pendente",
        "em_transito",
        "entregue",
        "atrasado",
        "cancelado",
      ],
      frete_tipo: ["cif", "fob", "cortesia"],
      notification_type: ["info", "success", "warning", "error", "achievement"],
    },
  },
} as const
