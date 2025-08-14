export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructions: Json | null
          name: string
          reward_item_name: string | null
          reward_rarity: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructions?: Json | null
          name: string
          reward_item_name?: string | null
          reward_rarity?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructions?: Json | null
          name?: string
          reward_item_name?: string | null
          reward_rarity?: string | null
        }
        Relationships: []
      }
      activity_completions: {
        Row: {
          activity_id: string
          completed_at: string
          id: string
          reward_earned: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          id?: string
          reward_earned?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          id?: string
          reward_earned?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      break_schedules: {
        Row: {
          break_time: string
          created_at: string
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          id: string
          is_active: boolean
          label: string | null
          user_id: string
        }
        Insert: {
          break_time: string
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          user_id: string
        }
        Update: {
          break_time?: string
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      city_items: {
        Row: {
          created_at: string
          id: string
          is_placed: boolean
          item_name: string
          item_type: string
          position_x: number
          position_y: number
          rarity: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_placed?: boolean
          item_name: string
          item_type: string
          position_x?: number
          position_y?: number
          rarity: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_placed?: boolean
          item_name?: string
          item_type?: string
          position_x?: number
          position_y?: number
          rarity?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string
          id: string
          reward_date: string
          reward_item: string | null
          reward_rarity: string | null
          reward_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_date: string
          reward_item?: string | null
          reward_rarity?: string | null
          reward_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_date?: string
          reward_item?: string | null
          reward_rarity?: string | null
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      screen_time_settings: {
        Row: {
          break_interval_minutes: number | null
          created_at: string
          daily_limit_minutes: number | null
          id: string
          notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_interval_minutes?: number | null
          created_at?: string
          daily_limit_minutes?: number | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          break_interval_minutes?: number | null
          created_at?: string
          daily_limit_minutes?: number | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          legendary_items_count: number
          rare_items_count: number
          streak_count: number
          total_breaks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          legendary_items_count?: number
          rare_items_count?: number
          streak_count?: number
          total_breaks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          legendary_items_count?: number
          rare_items_count?: number
          streak_count?: number
          total_breaks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          music_enabled: boolean
          notifications_enabled: boolean
          updated_at: string
          user_id: string
          voice_guidance_enabled: boolean
          volume: number
        }
        Insert: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          notifications_enabled?: boolean
          updated_at?: string
          user_id: string
          voice_guidance_enabled?: boolean
          volume?: number
        }
        Update: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
          voice_guidance_enabled?: boolean
          volume?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
