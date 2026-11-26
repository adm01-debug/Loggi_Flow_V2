export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      ai_delay_predictions: {
        Row: {
          analyzed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          prediction_data: Json
          probabilidade_atraso: number
          risco: string
        }
        Insert: {
          analyzed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          prediction_data: Json
          probabilidade_atraso: number
          risco: string
        }
        Update: {
          analyzed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          prediction_data?: Json
          probabilidade_atraso?: number
          risco?: string
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
      architecture_decisions: {
        Row: {
          consequences: string | null
          context: string | null
          created_at: string | null
          decision: string | null
          id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          consequences?: string | null
          context?: string | null
          created_at?: string | null
          decision?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          consequences?: string | null
          context?: string | null
          created_at?: string | null
          decision?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
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
      audit_logs_y2026m07: {
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
      audit_logs_y2026m08: {
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
      audit_logs_y2026m09: {
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
      audit_logs_y2026m10: {
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
      audit_logs_y2026m11: {
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
      audit_logs_y2026m12: {
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
      audit_logs_y2027m01: {
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
      audit_logs_y2027m02: {
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
      audit_logs_y2027m03: {
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
      audit_logs_y2027m04: {
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
      audit_logs_y2027m05: {
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
      audit_logs_y2027m06: {
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
      audit_logs_y2027m07: {
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
      automation_audit_logs: {
        Row: {
          action_taken: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          payload: Json | null
          rule_id: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          payload?: Json | null
          rule_id?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          payload?: Json | null
          rule_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      bio_sync_alert_rules: {
        Row: {
          bpm_critical_threshold: number | null
          bpm_warning_threshold: number | null
          cooldown_minutes: number | null
          created_at: string | null
          fatigue_warning_threshold: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          bpm_critical_threshold?: number | null
          bpm_warning_threshold?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          fatigue_warning_threshold?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          bpm_critical_threshold?: number | null
          bpm_warning_threshold?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          fatigue_warning_threshold?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: []
      }
      bio_sync_telemetry: {
        Row: {
          cause: string | null
          created_at: string
          driver_id: string
          fatigue_index: string
          heart_rate: number
          id: string
          severity: string | null
          suggested_action: string | null
          timestamp: string
          vehicle_id: string
        }
        Insert: {
          cause?: string | null
          created_at?: string
          driver_id: string
          fatigue_index: string
          heart_rate: number
          id?: string
          severity?: string | null
          suggested_action?: string | null
          timestamp?: string
          vehicle_id: string
        }
        Update: {
          cause?: string | null
          created_at?: string
          driver_id?: string
          fatigue_index?: string
          heart_rate?: number
          id?: string
          severity?: string | null
          suggested_action?: string | null
          timestamp?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      bitrix_sync_config: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          field_mapping: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_interval_minutes: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_interval_minutes?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_interval_minutes?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      bitrix_sync_logs: {
        Row: {
          config_id: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          status: string
          synced_items_count: number | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status: string
          synced_items_count?: number | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string
          synced_items_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_sync_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "bitrix_sync_config"
            referencedColumns: ["id"]
          },
        ]
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
      business_rules_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      carrier_rankings: {
        Row: {
          efficiency_score: number | null
          id: string
          last_updated: string | null
          on_time_shipments: number | null
          period: string
          rank_tier: string | null
          sla_percentage: number | null
          total_shipments: number | null
          transportadora_id: string
        }
        Insert: {
          efficiency_score?: number | null
          id?: string
          last_updated?: string | null
          on_time_shipments?: number | null
          period: string
          rank_tier?: string | null
          sla_percentage?: number | null
          total_shipments?: number | null
          transportadora_id: string
        }
        Update: {
          efficiency_score?: number | null
          id?: string
          last_updated?: string | null
          on_time_shipments?: number | null
          period?: string
          rank_tier?: string | null
          sla_percentage?: number | null
          total_shipments?: number | null
          transportadora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_rankings_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
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
          custo_estimado: number | null
          custo_real: number | null
          data_efetiva_coleta: string | null
          data_prevista_coleta: string | null
          data_recebimento: string | null
          deleted_at: string | null
          divergencia_percentual: number | null
          endereco_coleta: string
          fornecedor_id: string | null
          id: string
          is_reverse: boolean | null
          is_urgent: boolean | null
          link_rastreamento: string | null
          nf_anexo_url: string | null
          nf_fornecedor: string | null
          numero_coleta: string
          observacoes: string | null
          peso_efetivo: number | null
          peso_estimado_kg: number | null
          qtd_recebida: number | null
          qtd_volumes: number | null
          responsavel_recebimento: string | null
          status: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          codigo_rastreamento?: string | null
          comprovante_coleta_url?: string | null
          contato_coleta?: string | null
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_efetiva_coleta?: string | null
          data_prevista_coleta?: string | null
          data_recebimento?: string | null
          deleted_at?: string | null
          divergencia_percentual?: number | null
          endereco_coleta: string
          fornecedor_id?: string | null
          id?: string
          is_reverse?: boolean | null
          is_urgent?: boolean | null
          link_rastreamento?: string | null
          nf_anexo_url?: string | null
          nf_fornecedor?: string | null
          numero_coleta: string
          observacoes?: string | null
          peso_efetivo?: number | null
          peso_estimado_kg?: number | null
          qtd_recebida?: number | null
          qtd_volumes?: number | null
          responsavel_recebimento?: string | null
          status?: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta?: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          codigo_rastreamento?: string | null
          comprovante_coleta_url?: string | null
          contato_coleta?: string | null
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_efetiva_coleta?: string | null
          data_prevista_coleta?: string | null
          data_recebimento?: string | null
          deleted_at?: string | null
          divergencia_percentual?: number | null
          endereco_coleta?: string
          fornecedor_id?: string | null
          id?: string
          is_reverse?: boolean | null
          is_urgent?: boolean | null
          link_rastreamento?: string | null
          nf_anexo_url?: string | null
          nf_fornecedor?: string | null
          numero_coleta?: string
          observacoes?: string | null
          peso_efetivo?: number | null
          peso_estimado_kg?: number | null
          qtd_recebida?: number | null
          qtd_volumes?: number | null
          responsavel_recebimento?: string | null
          status?: Database["public"]["Enums"]["coleta_status"]
          tipo_coleta?: Database["public"]["Enums"]["coleta_tipo"]
          transportadora_id?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coletas_fornecedor"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coletas_transportadora"
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
      contract_test_logs: {
        Row: {
          created_at: string | null
          entity_name: string
          errors: Json | null
          id: string
          is_valid: boolean
          latency_ms: number | null
          payload: Json | null
          payload_hash: string | null
        }
        Insert: {
          created_at?: string | null
          entity_name: string
          errors?: Json | null
          id?: string
          is_valid: boolean
          latency_ms?: number | null
          payload?: Json | null
          payload_hash?: string | null
        }
        Update: {
          created_at?: string | null
          entity_name?: string
          errors?: Json | null
          id?: string
          is_valid?: boolean
          latency_ms?: number | null
          payload?: Json | null
          payload_hash?: string | null
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
          version: number | null
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
          version?: number | null
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
          version?: number | null
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
          normalization_data: Json | null
          observacoes: string | null
          origem_cidade: string | null
          origem_estado: string
          peso_kg: number | null
          prazo_dias: number | null
          responded_at: string | null
          retry_count: number | null
          status: string
          transportadora_id: string
          updated_at: string
          user_id: string
          valor_cotado: number | null
          valor_mercadoria: number | null
          version: number | null
          volumes: number | null
          workflow_logs: Json | null
        }
        Insert: {
          canal: string
          created_at?: string
          destino_cidade?: string | null
          destino_estado: string
          expires_at?: string
          id?: string
          normalization_data?: Json | null
          observacoes?: string | null
          origem_cidade?: string | null
          origem_estado: string
          peso_kg?: number | null
          prazo_dias?: number | null
          responded_at?: string | null
          retry_count?: number | null
          status?: string
          transportadora_id: string
          updated_at?: string
          user_id: string
          valor_cotado?: number | null
          valor_mercadoria?: number | null
          version?: number | null
          volumes?: number | null
          workflow_logs?: Json | null
        }
        Update: {
          canal?: string
          created_at?: string
          destino_cidade?: string | null
          destino_estado?: string
          expires_at?: string
          id?: string
          normalization_data?: Json | null
          observacoes?: string | null
          origem_cidade?: string | null
          origem_estado?: string
          peso_kg?: number | null
          prazo_dias?: number | null
          responded_at?: string | null
          retry_count?: number | null
          status?: string
          transportadora_id?: string
          updated_at?: string
          user_id?: string
          valor_cotado?: number | null
          valor_mercadoria?: number | null
          version?: number | null
          volumes?: number | null
          workflow_logs?: Json | null
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
      db_health_score_history: {
        Row: {
          anomaly_score: number
          capacity_score: number
          captured_at: string
          created_at: string
          details: Json
          grade: string
          id: string
          mttr_score: number
          overall_score: number
          slo_score: number
        }
        Insert: {
          anomaly_score: number
          capacity_score: number
          captured_at?: string
          created_at?: string
          details?: Json
          grade: string
          id?: string
          mttr_score: number
          overall_score: number
          slo_score: number
        }
        Update: {
          anomaly_score?: number
          capacity_score?: number
          captured_at?: string
          created_at?: string
          details?: Json
          grade?: string
          id?: string
          mttr_score?: number
          overall_score?: number
          slo_score?: number
        }
        Relationships: []
      }
      db_health_snapshots: {
        Row: {
          active_connections: number | null
          cache_hit_ratio: number | null
          created_at: string
          db_size_bytes: number | null
          deadlocks: number | null
          id: string
          metadata: Json
          total_connections: number | null
          wal_size_bytes: number | null
        }
        Insert: {
          active_connections?: number | null
          cache_hit_ratio?: number | null
          created_at?: string
          db_size_bytes?: number | null
          deadlocks?: number | null
          id?: string
          metadata?: Json
          total_connections?: number | null
          wal_size_bytes?: number | null
        }
        Update: {
          active_connections?: number | null
          cache_hit_ratio?: number | null
          created_at?: string
          db_size_bytes?: number | null
          deadlocks?: number | null
          id?: string
          metadata?: Json
          total_connections?: number | null
          wal_size_bytes?: number | null
        }
        Relationships: []
      }
      db_slo_daily: {
        Row: {
          cache_slo_pct: number
          computed_at: string
          connection_slo_pct: number
          day: string
          deadlock_free_pct: number
          id: string
          overall_slo_pct: number
          samples: number
        }
        Insert: {
          cache_slo_pct: number
          computed_at?: string
          connection_slo_pct: number
          day: string
          deadlock_free_pct: number
          id?: string
          overall_slo_pct: number
          samples: number
        }
        Update: {
          cache_slo_pct?: number
          computed_at?: string
          connection_slo_pct?: number
          day?: string
          deadlock_free_pct?: number
          id?: string
          overall_slo_pct?: number
          samples?: number
        }
        Relationships: []
      }
      delay_predictions_history: {
        Row: {
          actual_delay_hours: number | null
          confirmed_at: string | null
          created_at: string
          entity_id: string
          entity_numero: string | null
          entity_type: string
          fatores: Json
          horas_estimadas_atraso: number
          id: string
          motivos: Json
          predicted_at: string
          probabilidade_atraso: number
          recomendacoes: Json
          risco: string
          transportadora: string | null
          was_accurate: boolean | null
        }
        Insert: {
          actual_delay_hours?: number | null
          confirmed_at?: string | null
          created_at?: string
          entity_id: string
          entity_numero?: string | null
          entity_type: string
          fatores?: Json
          horas_estimadas_atraso?: number
          id?: string
          motivos?: Json
          predicted_at?: string
          probabilidade_atraso: number
          recomendacoes?: Json
          risco: string
          transportadora?: string | null
          was_accurate?: boolean | null
        }
        Update: {
          actual_delay_hours?: number | null
          confirmed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_numero?: string | null
          entity_type?: string
          fatores?: Json
          horas_estimadas_atraso?: number
          id?: string
          motivos?: Json
          predicted_at?: string
          probabilidade_atraso?: number
          recomendacoes?: Json
          risco?: string
          transportadora?: string | null
          was_accurate?: boolean | null
        }
        Relationships: []
      }
      delivery_receipt_audit: {
        Row: {
          created_at: string
          delivery_id: string
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          ocr_status: string | null
          storage_path: string
          upload_status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_id: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          ocr_status?: string | null
          storage_path: string
          upload_status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_id?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          ocr_status?: string | null
          storage_path?: string
          upload_status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_receipt_audit_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          box_alocado: string | null
          cliente_id: string | null
          codigo_rastreamento: string | null
          comprovante_audit_info: Json | null
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
          last_weather_update: string | null
          latitude: number | null
          link_rastreamento: string | null
          longitude: number | null
          nf_remessa: string | null
          nf_remessa_url: string | null
          numero_entrega: string
          observacoes: string | null
          ocr_data_extraida: Json | null
          previsao_entrega: string | null
          recebedor: string | null
          status: Database["public"]["Enums"]["entrega_status"]
          tags: string[] | null
          tipo_frete: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id: string | null
          updated_at: string
          valor_frete: number | null
          version: number | null
          weather_risk_score: number | null
        }
        Insert: {
          box_alocado?: string | null
          cliente_id?: string | null
          codigo_rastreamento?: string | null
          comprovante_audit_info?: Json | null
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
          last_weather_update?: string | null
          latitude?: number | null
          link_rastreamento?: string | null
          longitude?: number | null
          nf_remessa?: string | null
          nf_remessa_url?: string | null
          numero_entrega: string
          observacoes?: string | null
          ocr_data_extraida?: Json | null
          previsao_entrega?: string | null
          recebedor?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          tags?: string[] | null
          tipo_frete?: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number | null
          version?: number | null
          weather_risk_score?: number | null
        }
        Update: {
          box_alocado?: string | null
          cliente_id?: string | null
          codigo_rastreamento?: string | null
          comprovante_audit_info?: Json | null
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
          last_weather_update?: string | null
          latitude?: number | null
          link_rastreamento?: string | null
          longitude?: number | null
          nf_remessa?: string | null
          nf_remessa_url?: string | null
          numero_entrega?: string
          observacoes?: string | null
          ocr_data_extraida?: Json | null
          previsao_entrega?: string | null
          recebedor?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          tags?: string[] | null
          tipo_frete?: Database["public"]["Enums"]["frete_tipo"] | null
          transportadora_id?: string | null
          updated_at?: string
          valor_frete?: number | null
          version?: number | null
          weather_risk_score?: number | null
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
      error_events: {
        Row: {
          context: Json | null
          created_at: string | null
          error_message: string
          id: string
          severity: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          id?: string
          severity?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          id?: string
          severity?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      freight_decisions: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          recommendations: Json
          request_params: Json
          rule_applied: Json | null
          selected_carrier_id: string | null
          selected_carrier_name: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          recommendations: Json
          request_params: Json
          rule_applied?: Json | null
          selected_carrier_id?: string | null
          selected_carrier_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          recommendations?: Json
          request_params?: Json
          rule_applied?: Json | null
          selected_carrier_id?: string | null
          selected_carrier_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_decisions_selected_carrier_id_fkey"
            columns: ["selected_carrier_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_integration_mappings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          mapping_config: Json
          source_type: string
          transportadora_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mapping_config: Json
          source_type: string
          transportadora_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mapping_config?: Json
          source_type?: string
          transportadora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_integration_mappings_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_selection_rules: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_sla_days: number | null
          performance_weight: number | null
          price_weight: number | null
          time_weight: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_sla_days?: number | null
          performance_weight?: number | null
          price_weight?: number | null
          time_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_sla_days?: number | null
          performance_weight?: number | null
          price_weight?: number | null
          time_weight?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      freight_webhooks: {
        Row: {
          created_at: string | null
          endpoint_url: string
          event_type: string
          id: string
          is_active: boolean | null
          last_called_at: string | null
          secret_key: string | null
          transportadora_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_url: string
          event_type: string
          id?: string
          is_active?: boolean | null
          last_called_at?: string | null
          secret_key?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_url?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_called_at?: string | null
          secret_key?: string | null
          transportadora_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_webhooks_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      fretes_internos: {
        Row: {
          created_at: string
          data_entrega_efetiva: string | null
          deleted_at: string | null
          destino: string
          id: string
          motorista: string | null
          observacoes: string | null
          organization_id: string | null
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
          deleted_at?: string | null
          destino: string
          id?: string
          motorista?: string | null
          observacoes?: string | null
          organization_id?: string | null
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
          deleted_at?: string | null
          destino?: string
          id?: string
          motorista?: string | null
          observacoes?: string | null
          organization_id?: string | null
          origem?: string
          previsao_entrega?: string | null
          quantidade_itens?: number
          status?: Database["public"]["Enums"]["frete_interno_status"]
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "fretes_internos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      idempotency_keys: {
        Row: {
          id: string
          idempotency_key: string
          processed_at: string | null
          provider: string
        }
        Insert: {
          id?: string
          idempotency_key: string
          processed_at?: string | null
          provider: string
        }
        Update: {
          id?: string
          idempotency_key?: string
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      index_proposals: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          baseline_mean_ms: number | null
          confidence: string
          created_at: string
          ddl: string
          error_message: string | null
          id: string
          improvement_pct: number | null
          measured_at: string | null
          post_apply_mean_ms: number | null
          proposed_by: string | null
          queryid: number | null
          rationale: string | null
          revert_reason: string | null
          reverted_at: string | null
          status: string
          target_columns: string[] | null
          target_table: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_mean_ms?: number | null
          confidence?: string
          created_at?: string
          ddl: string
          error_message?: string | null
          id?: string
          improvement_pct?: number | null
          measured_at?: string | null
          post_apply_mean_ms?: number | null
          proposed_by?: string | null
          queryid?: number | null
          rationale?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          status?: string
          target_columns?: string[] | null
          target_table?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_mean_ms?: number | null
          confidence?: string
          created_at?: string
          ddl?: string
          error_message?: string | null
          id?: string
          improvement_pct?: number | null
          measured_at?: string | null
          post_apply_mean_ms?: number | null
          proposed_by?: string | null
          queryid?: number | null
          rationale?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          status?: string
          target_columns?: string[] | null
          target_table?: string | null
          updated_at?: string
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
      kanban_history: {
        Row: {
          action_by: string | null
          created_at: string
          delivery_id: string
          from_status: string | null
          id: string
          notes: string | null
          to_status: string
        }
        Insert: {
          action_by?: string | null
          created_at?: string
          delivery_id: string
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status: string
        }
        Update: {
          action_by?: string | null
          created_at?: string
          delivery_id?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_history_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
        ]
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
      logistica_reversa: {
        Row: {
          cliente_id: string | null
          codigo_rastreio_reverso: string | null
          created_at: string | null
          created_by: string | null
          descricao_detalhada: string | null
          entrega_id: string | null
          id: string
          motivo: string
          prioridade: string | null
          status: string
          updated_at: string | null
          valor_estorno: number | null
          version: number | null
        }
        Insert: {
          cliente_id?: string | null
          codigo_rastreio_reverso?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_detalhada?: string | null
          entrega_id?: string | null
          id?: string
          motivo: string
          prioridade?: string | null
          status?: string
          updated_at?: string | null
          valor_estorno?: number | null
          version?: number | null
        }
        Update: {
          cliente_id?: string | null
          codigo_rastreio_reverso?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_detalhada?: string | null
          entrega_id?: string | null
          id?: string
          motivo?: string
          prioridade?: string | null
          status?: string
          updated_at?: string | null
          valor_estorno?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logistica_reversa_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistica_reversa_entrega_id_fkey"
            columns: ["entrega_id"]
            isOneToOne: false
            referencedRelation: "entregas"
            referencedColumns: ["id"]
          },
        ]
      }
      mitigation_actions: {
        Row: {
          actions: Json
          category: string
          created_at: string
          executed_at: string | null
          focus_carrier: string | null
          headline: string
          id: string
          impact_score: number
          measured_at: string | null
          notes: string | null
          otif_after: number | null
          otif_before: number | null
          otif_delta: number | null
          priority: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          category: string
          created_at?: string
          executed_at?: string | null
          focus_carrier?: string | null
          headline: string
          id?: string
          impact_score?: number
          measured_at?: string | null
          notes?: string | null
          otif_after?: number | null
          otif_before?: number | null
          otif_delta?: number | null
          priority: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          category?: string
          created_at?: string
          executed_at?: string | null
          focus_carrier?: string | null
          headline?: string
          id?: string
          impact_score?: number
          measured_at?: string | null
          notes?: string | null
          otif_after?: number | null
          otif_before?: number | null
          otif_delta?: number | null
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nexus_tactical_logs: {
        Row: {
          alert_metadata: Json | null
          created_at: string
          event_time: string
          id: string
          message: string
          metadata: Json | null
          protocol_executed: boolean | null
          target_vehicle: string | null
          type: string
          vehicle_id: string | null
        }
        Insert: {
          alert_metadata?: Json | null
          created_at?: string
          event_time?: string
          id?: string
          message: string
          metadata?: Json | null
          protocol_executed?: boolean | null
          target_vehicle?: string | null
          type: string
          vehicle_id?: string | null
        }
        Update: {
          alert_metadata?: Json | null
          created_at?: string
          event_time?: string
          id?: string
          message?: string
          metadata?: Json | null
          protocol_executed?: boolean | null
          target_vehicle?: string | null
          type?: string
          vehicle_id?: string | null
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
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
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
      performance_metrics: {
        Row: {
          average_lead_time_hours: number | null
          created_at: string | null
          efficiency_score: number | null
          entity_id: string
          entity_type: string
          id: string
          late_deliveries: number | null
          on_time_deliveries: number | null
          period_end: string
          period_start: string
          sla_compliance_rate: number | null
          total_freights: number | null
          updated_at: string | null
        }
        Insert: {
          average_lead_time_hours?: number | null
          created_at?: string | null
          efficiency_score?: number | null
          entity_id: string
          entity_type: string
          id?: string
          late_deliveries?: number | null
          on_time_deliveries?: number | null
          period_end: string
          period_start: string
          sla_compliance_rate?: number | null
          total_freights?: number | null
          updated_at?: string | null
        }
        Update: {
          average_lead_time_hours?: number | null
          created_at?: string | null
          efficiency_score?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          late_deliveries?: number | null
          on_time_deliveries?: number | null
          period_end?: string
          period_start?: string
          sla_compliance_rate?: number | null
          total_freights?: number | null
          updated_at?: string | null
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
      prediction_accuracy_settings: {
        Row: {
          consecutive_days_alert: number
          created_at: string
          email: string | null
          id: string
          notify_email: boolean
          notify_whatsapp: boolean
          target_pct: number
          transportadora: string | null
          updated_at: string
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          consecutive_days_alert?: number
          created_at?: string
          email?: string | null
          id?: string
          notify_email?: boolean
          notify_whatsapp?: boolean
          target_pct?: number
          transportadora?: string | null
          updated_at?: string
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          consecutive_days_alert?: number
          created_at?: string
          email?: string | null
          id?: string
          notify_email?: boolean
          notify_whatsapp?: boolean
          target_pct?: number
          transportadora?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
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
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      rastreamento_historico_y2026m01: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m02: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m03: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m04: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m05: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m06: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m07: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m08: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m09: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m10: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m11: {
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
        Relationships: []
      }
      rastreamento_historico_y2026m12: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m01: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m02: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m03: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m04: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m05: {
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
        Relationships: []
      }
      rastreamento_historico_y2027m06: {
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
        Relationships: []
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
      remediation_actions: {
        Row: {
          admin_notes: string | null
          applied_at: string | null
          applied_by: string | null
          category: string
          created_at: string
          detail: string | null
          evidence: Json
          id: string
          recommended_action: string
          resolved_at: string | null
          severity: string
          status: string
          suggestion_id: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applied_at?: string | null
          applied_by?: string | null
          category: string
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          recommended_action: string
          resolved_at?: string | null
          severity: string
          status?: string
          suggestion_id: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applied_at?: string | null
          applied_by?: string | null
          category?: string
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          recommended_action?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          suggestion_id?: string
          title?: string
          updated_at?: string
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
      risk_zones: {
        Row: {
          cause: string | null
          center_lat: number
          center_lng: number
          created_at: string | null
          expires_at: string | null
          id: string
          radius: number
          severity: string | null
          suggested_action: string | null
        }
        Insert: {
          cause?: string | null
          center_lat: number
          center_lng: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          radius: number
          severity?: string | null
          suggested_action?: string | null
        }
        Update: {
          cause?: string | null
          center_lat?: number
          center_lng?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          radius?: number
          severity?: string | null
          suggested_action?: string | null
        }
        Relationships: []
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
      rte_gateway_health: {
        Row: {
          checked_at: string
          created_at: string
          error_message: string | null
          gateway: string
          http_status: number
          id: string
          latency_ms: number
          online: boolean
        }
        Insert: {
          checked_at?: string
          created_at?: string
          error_message?: string | null
          gateway: string
          http_status?: number
          id?: string
          latency_ms?: number
          online: boolean
        }
        Update: {
          checked_at?: string
          created_at?: string
          error_message?: string | null
          gateway?: string
          http_status?: number
          id?: string
          latency_ms?: number
          online?: boolean
        }
        Relationships: []
      }
      rte_slo_daily_snapshots: {
        Row: {
          avg_latency_ms: number
          checks: number
          created_at: string
          day: string
          error_budget_used_pct: number
          failures: number
          gateway: string
          id: string
          latency_p95_budget_ms: number
          p95_latency_ms: number
          status: string
          updated_at: string
          uptime_pct: number
          uptime_target_pct: number
        }
        Insert: {
          avg_latency_ms?: number
          checks?: number
          created_at?: string
          day: string
          error_budget_used_pct?: number
          failures?: number
          gateway: string
          id?: string
          latency_p95_budget_ms?: number
          p95_latency_ms?: number
          status?: string
          updated_at?: string
          uptime_pct?: number
          uptime_target_pct?: number
        }
        Update: {
          avg_latency_ms?: number
          checks?: number
          created_at?: string
          day?: string
          error_budget_used_pct?: number
          failures?: number
          gateway?: string
          id?: string
          latency_p95_budget_ms?: number
          p95_latency_ms?: number
          status?: string
          updated_at?: string
          uptime_pct?: number
          uptime_target_pct?: number
        }
        Relationships: []
      }
      rte_slo_targets: {
        Row: {
          created_at: string
          gateway: string
          id: string
          latency_p95_budget_ms: number
          updated_at: string
          updated_by: string | null
          uptime_target_pct: number
        }
        Insert: {
          created_at?: string
          gateway: string
          id?: string
          latency_p95_budget_ms?: number
          updated_at?: string
          updated_by?: string | null
          uptime_target_pct?: number
        }
        Update: {
          created_at?: string
          gateway?: string
          id?: string
          latency_p95_budget_ms?: number
          updated_at?: string
          updated_by?: string | null
          uptime_target_pct?: number
        }
        Relationships: []
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
      sla_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          freight_id: string
          id: string
          message: string | null
          resolved_at: string | null
          severity: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          freight_id: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          freight_id?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      system_heartbeat: {
        Row: {
          last_check: string
          latency_ms: number | null
          metadata: Json | null
          service_name: string
          status: string
          version: string | null
        }
        Insert: {
          last_check?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name: string
          status: string
          version?: string | null
        }
        Update: {
          last_check?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name?: string
          status?: string
          version?: string | null
        }
        Relationships: []
      }
      system_integrity_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_affected: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          severity: string
          success: boolean
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          entity_affected?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          severity: string
          success?: boolean
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_affected?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          success?: boolean
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
          coverage_details: Json | null
          created_at: string
          credentials: Json | null
          data_homologacao: string | null
          deleted_at: string | null
          email_comercial: string
          homologada: boolean | null
          id: string
          nome_fantasia: string
          non_api_config: Json | null
          observacoes: string | null
          prazo_medio_dias: number | null
          razao_social: string
          regioes_atendidas: string[] | null
          score_performance: number | null
          updated_at: string
          url_rastreamento: string | null
          version: number | null
          whatsapp_operacional: string | null
        }
        Insert: {
          api_disponivel?: boolean | null
          cnpj: string
          contato_comercial: string
          coverage_details?: Json | null
          created_at?: string
          credentials?: Json | null
          data_homologacao?: string | null
          deleted_at?: string | null
          email_comercial: string
          homologada?: boolean | null
          id?: string
          nome_fantasia: string
          non_api_config?: Json | null
          observacoes?: string | null
          prazo_medio_dias?: number | null
          razao_social: string
          regioes_atendidas?: string[] | null
          score_performance?: number | null
          updated_at?: string
          url_rastreamento?: string | null
          version?: number | null
          whatsapp_operacional?: string | null
        }
        Update: {
          api_disponivel?: boolean | null
          cnpj?: string
          contato_comercial?: string
          coverage_details?: Json | null
          created_at?: string
          credentials?: Json | null
          data_homologacao?: string | null
          deleted_at?: string | null
          email_comercial?: string
          homologada?: boolean | null
          id?: string
          nome_fantasia?: string
          non_api_config?: Json | null
          observacoes?: string | null
          prazo_medio_dias?: number | null
          razao_social?: string
          regioes_atendidas?: string[] | null
          score_performance?: number | null
          updated_at?: string
          url_rastreamento?: string | null
          version?: number | null
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
          nexus_score: number | null
          rank_id: string | null
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
          nexus_score?: number | null
          rank_id?: string | null
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
          nexus_score?: number | null
          rank_id?: string | null
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_levels_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["id"]
          },
        ]
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
          notifications_whatsapp: boolean | null
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
          notifications_whatsapp?: boolean | null
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
          notifications_whatsapp?: boolean | null
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
      user_panel_preferences: {
        Row: {
          created_at: string
          id: string
          sla_alto_horas: number
          sla_critico_horas: number
          sla_medio_horas: number
          sla_meta_on_time_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sla_alto_horas?: number
          sla_critico_horas?: number
          sla_medio_horas?: number
          sla_meta_on_time_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sla_alto_horas?: number
          sla_critico_horas?: number
          sla_medio_horas?: number
          sla_meta_on_time_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ranks: {
        Row: {
          color: string
          created_at: string | null
          icon: string
          id: string
          min_level: number
          name: string
          reward_multiplier: number | null
        }
        Insert: {
          color: string
          created_at?: string | null
          icon: string
          id?: string
          min_level: number
          name: string
          reward_multiplier?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          min_level?: number
          name?: string
          reward_multiplier?: number | null
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
      webhook_events_processed: {
        Row: {
          event_id: string
          id: string
          payload: Json | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          event_id: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          event_id?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      webhook_inbound_failures: {
        Row: {
          created_at: string
          error_message: string
          event_id: string | null
          id: string
          provider: string | null
          receiver: string
          response_status: number
        }
        Insert: {
          created_at?: string
          error_message: string
          event_id?: string | null
          id?: string
          provider?: string | null
          receiver: string
          response_status?: number
        }
        Update: {
          created_at?: string
          error_message?: string
          event_id?: string | null
          id?: string
          provider?: string | null
          receiver?: string
          response_status?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_prediction_accuracy: {
        Row: {
          acuracia_percentual: number | null
          dia: string | null
          risco: string | null
          total_acertos: number | null
          total_confirmadas: number | null
          total_predicoes: number | null
        }
        Relationships: []
      }
      v_prediction_accuracy_by_carrier: {
        Row: {
          acuracia_percentual: number | null
          desvio_medio_horas: number | null
          risco: string | null
          total_acertos: number | null
          total_confirmadas: number | null
          total_predicoes: number | null
          transportadora: string | null
          ultima_predicao: string | null
        }
        Relationships: []
      }
      v_prediction_accuracy_daily: {
        Row: {
          acertos: number | null
          acuracia_pct: number | null
          dia: string | null
          total_confirmadas: number | null
        }
        Relationships: []
      }
      v_prediction_accuracy_daily_carrier: {
        Row: {
          acertos: number | null
          acuracia_pct: number | null
          dia: string | null
          total_confirmadas: number | null
          transportadora: string | null
        }
        Relationships: []
      }
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
      alert_slow_queries:
        | {
            Args: { threshold_ms?: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.alert_slow_queries(threshold_ms => int4), public.alert_slow_queries(threshold_ms => numeric). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { threshold_ms?: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.alert_slow_queries(threshold_ms => int4), public.alert_slow_queries(threshold_ms => numeric). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      apply_index_proposal: { Args: { p_id: string }; Returns: Json }
      auto_revert_ineffective_indexes: {
        Args: { p_min_hours?: number; p_min_improvement?: number }
        Returns: Json
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      cancel_long_running_query: {
        Args: { p_pid: number; p_terminate?: boolean }
        Returns: boolean
      }
      check_and_alert_health_regression: { Args: never; Returns: Json }
      cleanup_old_contract_test_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_delay_predictions: { Args: never; Returns: undefined }
      cleanup_old_health_snapshots: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_notifications: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_telemetry_logs:
        | { Args: never; Returns: undefined }
        | { Args: { days_to_keep?: number }; Returns: number }
      compute_db_slo_for: {
        Args: { p_day: string }
        Returns: {
          cache_slo_pct: number
          computed_at: string
          connection_slo_pct: number
          day: string
          deadlock_free_pct: number
          id: string
          overall_slo_pct: number
          samples: number
        }
        SetofOptions: {
          from: "*"
          to: "db_slo_daily"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      count_prediction_breach_days: {
        Args: { _carrier?: string; _target: number }
        Returns: number
      }
      count_prediction_breach_days_bulk: {
        Args: { _pairs: Json }
        Returns: {
          breach_days: number
          carrier: string
          target: number
        }[]
      }
      detect_health_score_regression: {
        Args: { p_threshold?: number }
        Returns: {
          current_at: string
          current_score: number
          delta: number
          previous_at: string
          previous_score: number
          regression_detected: boolean
        }[]
      }
      drop_old_partitions: {
        Args: {
          p_months_to_keep: number
          p_parent_table: string
          p_prefix: string
        }
        Returns: number
      }
      ensure_future_partitions: { Args: never; Returns: Json }
      ensure_monthly_partition: {
        Args: { p_month: number; p_parent: string; p_year: number }
        Returns: string
      }
      execute_nexus_protocol: {
        Args: { protocol_name: string; vehicle_id: string }
        Returns: Json
      }
      fn_valida_transicao_coleta: {
        Args: {
          p_de: Database["public"]["Enums"]["coleta_status"]
          p_para: Database["public"]["Enums"]["coleta_status"]
        }
        Returns: boolean
      }
      fn_valida_transicao_entrega: {
        Args: {
          p_de: Database["public"]["Enums"]["entrega_status"]
          p_para: Database["public"]["Enums"]["entrega_status"]
        }
        Returns: boolean
      }
      get_active_sessions_summary: {
        Args: never
        Returns: {
          longest_query_seconds: number
          longest_xact_seconds: number
          oldest_session_seconds: number
          sample_query: string
          session_count: number
          severity: string
          state: string
          wait_event_type: string
        }[]
      }
      get_autovacuum_health: {
        Args: { p_limit?: number }
        Returns: {
          autovacuum_count: number
          days_since_vacuum: number
          dead_pct: number
          dead_tuples: number
          last_analyze: string
          last_autoanalyze: string
          last_autovacuum: string
          last_vacuum: string
          live_tuples: number
          recommended_action: string
          schema_name: string
          severity: string
          table_name: string
          vacuum_count: number
        }[]
      }
      get_bloat_hotspots: {
        Args: { p_limit?: number; p_min_dead_tuples?: number }
        Returns: {
          dead_pct: number
          dead_tuples: number
          estimated_bloat_bytes: number
          last_analyze: string
          last_autovacuum: string
          last_vacuum: string
          live_tuples: number
          schema_name: string
          severity: string
          table_name: string
          table_size_bytes: number
          vacuum_ddl: string
        }[]
      }
      get_cache_hit_ratios: {
        Args: { p_limit?: number; p_max_ratio?: number; p_min_reads?: number }
        Returns: {
          combined_hit_ratio: number
          heap_blks_hit: number
          heap_blks_read: number
          heap_hit_ratio: number
          idx_blks_hit: number
          idx_blks_read: number
          idx_hit_ratio: number
          recommendation: string
          schema_name: string
          severity: string
          table_name: string
          table_size_bytes: number
        }[]
      }
      get_calibrated_tolerance: {
        Args: { _transportadora: string }
        Returns: number
      }
      get_capacity_forecast_fast: {
        Args: { p_hours_ahead?: number }
        Returns: {
          current_value: number
          forecast_value: number
          hours_ahead: number
          hours_until_threshold: number
          metric: string
          severity: string
          slope_per_hour: number
          threshold: number
        }[]
      }
      get_carrier_performance_stats: {
        Args: never
        Returns: {
          entregas_no_prazo: number
          nome_fantasia: string
          otif_percent: number
          tempo_medio_coleta_horas: number
          total_entregas: number
          transportadora_id: string
        }[]
      }
      get_cron_jobs_status: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          last_duration_ms: number
          last_start: string
          last_status: string
          schedule: string
        }[]
      }
      get_current_organization_id: { Args: never; Returns: string }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_duplicate_indexes: {
        Args: { p_limit?: number }
        Returns: {
          drop_columns: string
          drop_ddl: string
          drop_index: string
          drop_scans: number
          drop_size_bytes: number
          keep_columns: string
          keep_index: string
          keep_scans: number
          keep_size_bytes: number
          relationship: string
          schema_name: string
          severity: string
          table_name: string
        }[]
      }
      get_extensions_audit: {
        Args: never
        Returns: {
          default_version: string
          extension_name: string
          installed_version: string
          is_relocatable: boolean
          recommendation: string
          schema_name: string
          severity: string
          update_available: boolean
        }[]
      }
      get_global_health_score_fast: {
        Args: never
        Returns: {
          anomaly_score: number
          capacity_score: number
          computed_at: string
          details: Json
          grade: string
          mttr_score: number
          overall_score: number
          slo_score: number
        }[]
      }
      get_health_anomalies_fast: {
        Args: never
        Returns: {
          current_value: number
          detected_at: string
          mean_value: number
          metric: string
          severity: string
          stddev_value: number
          z_score: number
        }[]
      }
      get_health_score_history_fast: {
        Args: { p_days?: number }
        Returns: {
          anomaly_score: number
          capacity_score: number
          captured_at: string
          grade: string
          mttr_score: number
          overall_score: number
          slo_score: number
        }[]
      }
      get_index_roi_summary: {
        Args: never
        Returns: {
          avg_improvement_pct: number
          best_improvement_pct: number
          effective_indexes: number
          ineffective_indexes: number
          measured_count: number
          total_applied: number
          total_ms_saved_per_call: number
          total_proposed: number
          total_rejected: number
          total_reverted: number
          worst_improvement_pct: number
        }[]
      }
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
      get_load_heatmap: {
        Args: { p_days?: number }
        Returns: {
          avg_active_connections: number
          avg_cache_hit_ratio: number
          day_of_week: number
          hour_of_day: number
          intensity: number
          max_active_connections: number
          sample_count: number
        }[]
      }
      get_lock_conflicts: {
        Args: { p_limit?: number }
        Returns: {
          blocked_duration_seconds: number
          blocked_pid: number
          blocked_query: string
          blocked_user: string
          blocking_pid: number
          blocking_query: string
          blocking_state: string
          blocking_user: string
          lock_mode: string
          lock_type: string
          relation: string
          severity: string
        }[]
      }
      get_long_running_queries: {
        Args: { p_limit?: number; p_min_seconds?: number }
        Returns: {
          application_name: string
          client_addr: string
          duration_seconds: number
          pid: number
          query: string
          query_start: string
          severity: string
          state: string
          usename: string
          wait_event: string
          wait_event_type: string
        }[]
      }
      get_maintenance_windows: {
        Args: { p_days?: number; p_limit?: number; p_window_hours?: number }
        Returns: {
          avg_load: number
          day_name: string
          day_of_week: number
          end_hour: number
          peak_load: number
          rank: number
          recommendation: string
          start_hour: number
          vs_daily_peak_pct: number
        }[]
      }
      get_monthly_analytics: {
        Args: { end_date: string; start_date: string }
        Returns: {
          coletas_count: number
          custo_total: number
          entregas_count: number
          month_label: string
          ocorrencias_count: number
          sla_atingido: number
        }[]
      }
      get_public_tracking: {
        Args: { p_code: string }
        Returns: {
          cliente_razao_social: string
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
      get_query_detail_fast: {
        Args: { p_queryid: number }
        Returns: {
          cache_hit_pct: number
          calls: number
          max_exec_ms: number
          mean_exec_ms: number
          min_exec_ms: number
          query_text: string
          queryid: number
          rows_returned: number
          shared_blks_hit: number
          shared_blks_read: number
          stddev_exec_ms: number
          total_exec_ms: number
        }[]
      }
      get_query_index_suggestion: {
        Args: { p_queryid: number }
        Returns: {
          confidence: string
          rationale: string
          recommended_ddl: string
          suggestion_type: string
          target_columns: string[]
          target_table: string
        }[]
      }
      get_query_regressions_fast: {
        Args: never
        Returns: {
          baseline_mean_ms: number
          current_mean_ms: number
          query_text: string
          queryid: number
          regression_pct: number
        }[]
      }
      get_remediation_mttr_fast: {
        Args: never
        Returns: {
          category: string
          last_resolved_at: string
          mttr_hours: number
          mttr_p50_hours: number
          mttr_p95_hours: number
          resolution_rate_pct: number
          total_applied: number
          total_ignored: number
          total_pending: number
          total_resolved: number
        }[]
      }
      get_remediation_suggestions_fast: {
        Args: never
        Returns: {
          category: string
          detail: string
          evidence: Json
          id: string
          recommended_action: string
          severity: string
          title: string
        }[]
      }
      get_replication_status: {
        Args: never
        Returns: {
          application_name: string
          backend_start: string
          client_addr: string
          flush_lag_bytes: number
          flush_lag_seconds: number
          pid: number
          replay_lag_bytes: number
          replay_lag_seconds: number
          severity: string
          state: string
          sync_state: string
          total_lag_bytes: number
          usename: string
          write_lag_bytes: number
          write_lag_seconds: number
        }[]
      }
      get_rls_audit: {
        Args: never
        Returns: {
          has_delete_policy: boolean
          has_insert_policy: boolean
          has_select_policy: boolean
          has_update_policy: boolean
          policy_count: number
          recommendation: string
          rls_enabled: boolean
          schema_name: string
          severity: string
          table_name: string
        }[]
      }
      get_seq_scan_hotspots: {
        Args: { p_limit?: number; p_min_live_tuples?: number }
        Returns: {
          avg_tuples_per_scan: number
          idx_scan: number
          idx_tup_fetch: number
          live_tuples: number
          schema_name: string
          seq_ratio: number
          seq_scan: number
          seq_tup_read: number
          severity: string
          table_name: string
          table_size_bytes: number
        }[]
      }
      get_table_coaccess_graph: {
        Args: { p_limit?: number }
        Returns: {
          avg_mean_ms: number
          co_occurrences: number
          table_a: string
          table_b: string
          total_calls: number
          total_time_ms: number
        }[]
      }
      get_temp_file_stats: {
        Args: { p_limit?: number }
        Returns: {
          calls: number
          identifier: string
          mean_exec_ms: number
          query_text: string
          recommendation: string
          scope: string
          severity: string
          temp_bytes: number
          temp_files: number
        }[]
      }
      get_top_queries_fast: {
        Args: { p_limit?: number }
        Returns: {
          calls: number
          max_exec_ms: number
          mean_exec_ms: number
          query_text: string
          queryid: number
          rows_returned: number
          total_exec_ms: number
        }[]
      }
      get_top_tables_by_size: {
        Args: { p_limit?: number }
        Returns: {
          bytes_per_row: number
          estimated_rows: number
          indexes_bytes: number
          recommendation: string
          schema_name: string
          severity: string
          table_bytes: number
          table_name: string
          toast_bytes: number
          total_bytes: number
        }[]
      }
      get_transaction_health: {
        Args: never
        Returns: {
          deadlocks: number
          hours_since_reset: number
          recommendation: string
          rollback_ratio_pct: number
          rollbacks_per_hour: number
          severity: string
          stats_since: string
          temp_bytes: number
          temp_files: number
          total_commits: number
          total_rollbacks: number
        }[]
      }
      get_unindexed_foreign_keys: {
        Args: never
        Returns: {
          constraint_name: string
          fk_columns: string[]
          referenced_table: string
          severity: string
          suggested_ddl: string
          table_name: string
          table_size_bytes: number
        }[]
      }
      get_unused_indexes: {
        Args: { p_limit?: number; p_min_size_bytes?: number }
        Returns: {
          drop_ddl: string
          index_name: string
          index_scans: number
          index_size_bytes: number
          is_primary: boolean
          is_unique: boolean
          schema_name: string
          severity: string
          table_name: string
          table_size_bytes: number
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
      get_wal_health: {
        Args: never
        Returns: {
          checkpoint_timeout_s: number
          db_size_bytes: number
          max_wal_size_mb: number
          recommendation: string
          severity: string
          wal_size_bytes: number
          wal_to_db_ratio: number
        }[]
      }
      get_wraparound_status: {
        Args: { p_limit?: number }
        Returns: {
          freeze_max_age: number
          last_autovacuum: string
          pct_towards_wraparound: number
          recommendation: string
          schema_name: string
          severity: string
          table_name: string
          table_size_bytes: number
          xid_age: number
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
      mcp_exec: { Args: { max_rows?: number; sql: string }; Returns: Json }
      mcp_exec_many: {
        Args: { max_rows?: number; statements: string[] }
        Returns: Json
      }
      measure_index_proposal_impact: { Args: { p_id: string }; Returns: Json }
      persist_db_health_snapshot: { Args: never; Returns: string }
      persist_global_health_score: { Args: never; Returns: string }
      purchase_reward: {
        Args: { p_reward_item_id: string; p_user_id: string }
        Returns: Json
      }
      purge_rte_gateway_health: {
        Args: { retention_days?: number }
        Returns: number
      }
      purge_webhook_inbound_failures: {
        Args: { _keep_days?: number }
        Returns: number
      }
      record_heartbeat: { Args: never; Returns: undefined }
      registrar_crash_ui: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_stack_trace?: string
          p_url?: string
        }
        Returns: undefined
      }
      reject_index_proposal: {
        Args: { p_id: string; p_reason?: string }
        Returns: undefined
      }
      rte_gateway_sustained_downtime: {
        Args: { window_hours?: number }
        Returns: {
          checks: number
          gateway: string
          last_checked_at: string
          last_error: string
        }[]
      }
      rte_rollup_slo_daily: { Args: { target_day?: string }; Returns: number }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
