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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          subscriber_count: number | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_count: number | null
          view_count: number | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_count?: number | null
          view_count?: number | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      competitors: {
        Row: {
          avg_views: number | null
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          subscriber_count: number | null
          top_video_title: string | null
          top_video_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_views?: number | null
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          top_video_title?: string | null
          top_video_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_views?: number | null
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          top_video_title?: string | null
          top_video_views?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          created_at: string
          id: string
          input_text: string | null
          output_data: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text?: string | null
          output_data: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string | null
          output_data?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      keywords: {
        Row: {
          competition_score: number | null
          id: string
          keyword: string
          related_keywords: string[] | null
          search_volume: number | null
          trend_direction: string | null
          updated_at: string
        }
        Insert: {
          competition_score?: number | null
          id?: string
          keyword: string
          related_keywords?: string[] | null
          search_volume?: number | null
          trend_direction?: string | null
          updated_at?: string
        }
        Update: {
          competition_score?: number | null
          id?: string
          keyword?: string
          related_keywords?: string[] | null
          search_volume?: number | null
          trend_direction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          competition_score: number | null
          created_at: string
          id: string
          scanned_at: string
          status: string | null
          suggested_idea: string | null
          time_window: string | null
          topic: string
          trend_probability: number
        }
        Insert: {
          competition_score?: number | null
          created_at?: string
          id?: string
          scanned_at?: string
          status?: string | null
          suggested_idea?: string | null
          time_window?: string | null
          topic: string
          trend_probability: number
        }
        Update: {
          competition_score?: number | null
          created_at?: string
          id?: string
          scanned_at?: string
          status?: string | null
          suggested_idea?: string | null
          time_window?: string | null
          topic?: string
          trend_probability?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          subscription_tier: string
          updated_at: string
          user_id: string
          youtube_channel_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          subscription_tier?: string
          updated_at?: string
          user_id: string
          youtube_channel_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          subscription_tier?: string
          updated_at?: string
          user_id?: string
          youtube_channel_id?: string | null
        }
        Relationships: []
      }
      token_balances: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      trends: {
        Row: {
          category: string | null
          comment_count: number | null
          detected_at: string
          engagement_rate: number | null
          id: string
          like_count: number | null
          region: string | null
          scanned_at: string
          source: string | null
          top_channel: string | null
          topic: string
          total_views: number | null
          trend_score: number | null
          velocity: number | null
          video_count: number | null
          views_per_hour: number | null
        }
        Insert: {
          category?: string | null
          comment_count?: number | null
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          like_count?: number | null
          region?: string | null
          scanned_at?: string
          source?: string | null
          top_channel?: string | null
          topic: string
          total_views?: number | null
          trend_score?: number | null
          velocity?: number | null
          video_count?: number | null
          views_per_hour?: number | null
        }
        Update: {
          category?: string | null
          comment_count?: number | null
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          like_count?: number | null
          region?: string | null
          scanned_at?: string
          source?: string | null
          top_channel?: string | null
          topic?: string
          total_views?: number | null
          trend_score?: number | null
          velocity?: number | null
          video_count?: number | null
          views_per_hour?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          channel_id: string | null
          comment_count: number | null
          created_at: string
          id: string
          like_count: number | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          video_id: string
          view_count: number | null
        }
        Insert: {
          channel_id?: string | null
          comment_count?: number | null
          created_at?: string
          id?: string
          like_count?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          video_id: string
          view_count?: number | null
        }
        Update: {
          channel_id?: string | null
          comment_count?: number | null
          created_at?: string
          id?: string
          like_count?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_tokens: {
        Args: {
          _action_type: string
          _amount: number
          _description?: string
          _user_id: string
        }
        Returns: boolean
      }
      grant_tokens: {
        Args: {
          _action_type: string
          _amount: number
          _description?: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
