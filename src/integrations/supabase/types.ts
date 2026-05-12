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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          locked_until: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          locked_until: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          locked_until?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
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
      allowed_ips: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_active: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      business_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean
          name: string
          priority: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_webhooks: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          events: string[]
          id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          secret?: string
          updated_at?: string
          url?: string
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      conciliacao_itens_importados: {
        Row: {
          conciliacao_id: string
          conciliado_em: string | null
          conciliado_por: string | null
          created_at: string
          dados_originais: Json | null
          data_documento: string | null
          descricao: string | null
          diferenca_valor: number | null
          id: string
          item_sistema_id: string | null
          linha_arquivo: number | null
          observacoes: string | null
          referencia_externa: string | null
          status: string
          transportadora_nome: string | null
          valor: number
        }
        Insert: {
          conciliacao_id: string
          conciliado_em?: string | null
          conciliado_por?: string | null
          created_at?: string
          dados_originais?: Json | null
          data_documento?: string | null
          descricao?: string | null
          diferenca_valor?: number | null
          id?: string
          item_sistema_id?: string | null
          linha_arquivo?: number | null
          observacoes?: string | null
          referencia_externa?: string | null
          status?: string
          transportadora_nome?: string | null
          valor: number
        }
        Update: {
          conciliacao_id?: string
          conciliado_em?: string | null
          conciliado_por?: string | null
          created_at?: string
          dados_originais?: Json | null
          data_documento?: string | null
          descricao?: string | null
          diferenca_valor?: number | null
          id?: string
          item_sistema_id?: string | null
          linha_arquivo?: number | null
          observacoes?: string | null
          referencia_externa?: string | null
          status?: string
          transportadora_nome?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "conciliacao_itens_importados_conciliacao_id_fkey"
            columns: ["conciliacao_id"]
            isOneToOne: false
            referencedRelation: "conciliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          diferenca_total: number | null
          id: string
          nome: string
          periodo_fim: string | null
          periodo_inicio: string | null
          status: string
          tipo: string
          total_divergencias: number
          total_itens_conciliados: number
          total_itens_importados: number
          updated_at: string
          valor_total_importado: number | null
          valor_total_sistema: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          diferenca_total?: number | null
          id?: string
          nome: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          tipo: string
          total_divergencias?: number
          total_itens_conciliados?: number
          total_itens_importados?: number
          updated_at?: string
          valor_total_importado?: number | null
          valor_total_sistema?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          diferenca_total?: number | null
          id?: string
          nome?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          tipo?: string
          total_divergencias?: number
          total_itens_conciliados?: number
          total_itens_importados?: number
          updated_at?: string
          valor_total_importado?: number | null
          valor_total_sistema?: number | null
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
      cotacoes_multicanal: {
        Row: {
          canal: string
          created_at: string
          destino_cidade: string | null
          destino_estado: string
          expires_at: string
          id: string
          observacoes: string | null
          origem_cidade: string | null
          origem_estado: string
          peso_kg: number | null
          prazo_dias: number | null
          responded_at: string | null
          status: string
          transportadora_id: string
          updated_at: string
          user_id: string
          valor_cotado: number | null
          valor_mercadoria: number | null
          volumes: number | null
        }
        Insert: {
          canal: string
          created_at?: string
          destino_cidade?: string | null
          destino_estado: string
          expires_at?: string
          id?: string
          observacoes?: string | null
          origem_cidade?: string | null
          origem_estado: string
          peso_kg?: number | null
          prazo_dias?: number | null
          responded_at?: string | null
          status?: string
          transportadora_id: string
          updated_at?: string
          user_id: string
          valor_cotado?: number | null
          valor_mercadoria?: number | null
          volumes?: number | null
        }
        Update: {
          canal?: string
          created_at?: string
          destino_cidade?: string | null
          destino_estado?: string
          expires_at?: string
          id?: string
          observacoes?: string | null
          origem_cidade?: string | null
          origem_estado?: string
          peso_kg?: number | null
          prazo_dias?: number | null
          responded_at?: string | null
          status?: string
          transportadora_id?: string
          updated_at?: string
          user_id?: string
          valor_cotado?: number | null
          valor_mercadoria?: number | null
          volumes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_multicanal_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
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
          deleted_at: string | null
          endereco_entrega: string
          geocoded_at: string | null
          id: string
          is_cross_docking: boolean | null
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
          deleted_at?: string | null
          endereco_entrega: string
          geocoded_at?: string | null
          id?: string
          is_cross_docking?: boolean | null
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
          deleted_at?: string | null
          endereco_entrega?: string
          geocoded_at?: string | null
          id?: string
          is_cross_docking?: boolean | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      geo_access_rules: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      geo_blocked_attempts: {
        Row: {
          country_code: string | null
          country_name: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: string
          user_agent: string | null
        }
        Insert: {
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address: string
          user_agent?: string | null
        }
        Update: {
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      geo_blocking_rules: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          rule_type: string
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rule_type: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_blocking_settings: {
        Row: {
          default_action: string
          id: string
          mode: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_action?: string
          id?: string
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_action?: string
          id?: string
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ip_access_rules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ip_pattern: string
          is_active: boolean
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_pattern: string
          is_active?: boolean
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_pattern?: string
          is_active?: boolean
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      known_devices: {
        Row: {
          browser: string | null
          device_fingerprint: string
          device_type: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_seen_at: string
          location: string | null
          name: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_fingerprint: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen_at?: string
          location?: string | null
          name?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen_at?: string
          location?: string | null
          name?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
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
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          device_type: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_telemetry: {
        Row: {
          count_mode: string | null
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          operation: string
          query_limit: number | null
          query_offset: number | null
          record_count: number | null
          rpc_name: string | null
          severity: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
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
      rate_limit_logs: {
        Row: {
          blocked: boolean
          created_at: string
          endpoint: string
          id: string
          ip_address: string
          request_count: number
          user_id: string | null
          window_start: string
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Update: {
          blocked?: boolean
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
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
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_execution_logs: {
        Row: {
          actions_executed: Json | null
          conditions_met: boolean
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          rule_id: string | null
          trigger_event: string
        }
        Insert: {
          actions_executed?: Json | null
          conditions_met: boolean
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          rule_id?: string | null
          trigger_event: string
        }
        Update: {
          actions_executed?: Json | null
          conditions_met?: boolean
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          rule_id?: string | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "business_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          filters: Json | null
          frequency: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          name: string
          next_send_at: string | null
          recipients: string[]
          report_type: string
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          filters?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          name: string
          next_send_at?: string | null
          recipients?: string[]
          report_type: string
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          filters?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          name?: string
          next_send_at?: string | null
          recipients?: string[]
          report_type?: string
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      telemetry_logs: {
        Row: {
          category: string
          created_at: string
          device_info: Json | null
          id: string
          message: string
          metadata: Json | null
          severity: string
          stack_trace: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          device_info?: Json | null
          id?: string
          message: string
          metadata?: Json | null
          severity: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          device_info?: Json | null
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transportadora_rotas: {
        Row: {
          ativo: boolean | null
          created_at: string
          destino_cep_fim: string | null
          destino_cep_inicio: string | null
          destino_cidade: string | null
          destino_estado: string
          id: string
          observacoes: string | null
          origem_cep_fim: string | null
          origem_cep_inicio: string | null
          origem_cidade: string | null
          origem_estado: string
          prazo_dias: number | null
          preco_por_kg: number | null
          taxa_fixa: number | null
          transportadora_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          destino_cep_fim?: string | null
          destino_cep_inicio?: string | null
          destino_cidade?: string | null
          destino_estado: string
          id?: string
          observacoes?: string | null
          origem_cep_fim?: string | null
          origem_cep_inicio?: string | null
          origem_cidade?: string | null
          origem_estado: string
          prazo_dias?: number | null
          preco_por_kg?: number | null
          taxa_fixa?: number | null
          transportadora_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          destino_cep_fim?: string | null
          destino_cep_inicio?: string | null
          destino_cidade?: string | null
          destino_estado?: string
          id?: string
          observacoes?: string | null
          origem_cep_fim?: string | null
          origem_cep_inicio?: string | null
          origem_cidade?: string | null
          origem_estado?: string
          prazo_dias?: number | null
          preco_por_kg?: number | null
          taxa_fixa?: number | null
          transportadora_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transportadora_rotas_transportadora_id_fkey"
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          notifications_achievements: boolean
          notifications_coletas: boolean
          notifications_custos: boolean
          notifications_email: boolean
          notifications_entregas: boolean
          notifications_ocorrencias: boolean
          notifications_push: boolean
          notifications_sla: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_achievements?: boolean
          notifications_coletas?: boolean
          notifications_custos?: boolean
          notifications_email?: boolean
          notifications_entregas?: boolean
          notifications_ocorrencias?: boolean
          notifications_push?: boolean
          notifications_sla?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_achievements?: boolean
          notifications_coletas?: boolean
          notifications_custos?: boolean
          notifications_email?: boolean
          notifications_entregas?: boolean
          notifications_ocorrencias?: boolean
          notifications_push?: boolean
          notifications_sla?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string
          current_step: number | null
          id: string
          updated_at: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          updated_at?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string
          current_step?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number | null
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
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_name: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active_at: string
          location: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          location?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          location?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          friendly_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_status: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_status?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_status?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "client_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: {
        Args: {
          p_coins_amount?: number
          p_user_id: string
          p_xp_amount: number
        }
        Returns: undefined
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      cleanup_old_telemetry_logs: { Args: never; Returns: undefined }
      get_leaderboard: {
        Args: { limit_count?: number; period_filter?: string }
        Returns: {
          achievements_count: number
          avatar_url: string
          coins: number
          full_name: string
          level: number
          rank: number
          streak_days: number
          total_xp: number
          user_id: string
        }[]
      }
      get_public_tracking: {
        Args: { p_code: string }
        Returns: {
          codigo_rastreamento: string
          comprovante_entrega_url: string
          created_at: string
          data_despacho: string
          data_entrega_efetiva: string
          endereco_entrega: string
          nf_remessa: string
          numero_entrega: string
          previsao_entrega: string
          recebedor: string
          status: Database["public"]["Enums"]["entrega_status"]
          updated_at: string
        }[]
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          module: string
          permission_code: string
          permission_name: string
        }[]
      }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_reward: {
        Args: { p_reward_item_id: string; p_user_id: string }
        Returns: Json
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
