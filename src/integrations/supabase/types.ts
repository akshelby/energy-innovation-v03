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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          label: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          label?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          label?: string | null
        }
        Relationships: []
      }
      careers: {
        Row: {
          created_at: string
          department_ar: string
          department_en: string
          description_ar: string
          description_en: string
          id: string
          is_active: boolean
          location_ar: string
          location_en: string
          requirements_ar: string
          requirements_en: string
          sort_order: number
          status: string
          title_ar: string
          title_en: string
          type_ar: string
          type_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_ar?: string
          department_en?: string
          description_ar?: string
          description_en?: string
          id?: string
          is_active?: boolean
          location_ar?: string
          location_en?: string
          requirements_ar?: string
          requirements_en?: string
          sort_order?: number
          status?: string
          title_ar?: string
          title_en?: string
          type_ar?: string
          type_en?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_ar?: string
          department_en?: string
          description_ar?: string
          description_en?: string
          id?: string
          is_active?: boolean
          location_ar?: string
          location_en?: string
          requirements_ar?: string
          requirements_en?: string
          sort_order?: number
          status?: string
          title_ar?: string
          title_en?: string
          type_ar?: string
          type_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_addresses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label_ar: string
          label_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          country_code: string
          created_at: string
          flag_url: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          flag_url?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          flag_url?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_height: number
          logo_url: string | null
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_height?: number
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_height?: number
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label_ar: string
          label_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label_ar?: string
          label_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label_ar?: string
          label_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_enquiries: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          product_item_id: string | null
          product_name: string
          requirement: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          product_item_id?: string | null
          product_name?: string
          requirement: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          product_item_id?: string | null
          product_name?: string
          requirement?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_enquiries_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          category_key: string
          created_at: string
          has_page: boolean
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          parent_id: string | null
          pdf_url: string | null
          sort_order: number
        }
        Insert: {
          category_key?: string
          created_at?: string
          has_page?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          pdf_url?: string | null
          sort_order?: number
        }
        Update: {
          category_key?: string
          created_at?: string
          has_page?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          pdf_url?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_page_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_page_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_page_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_page_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_page_images_product_page_id_fkey"
            columns: ["product_page_id"]
            isOneToOne: false
            referencedRelation: "product_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pages: {
        Row: {
          applications_ar: string[] | null
          applications_en: string[] | null
          certifications_ar: string[] | null
          certifications_en: string[] | null
          created_at: string
          description_ar: string
          description_en: string
          headline_ar: string
          headline_en: string
          id: string
          is_active: boolean
          operation_modes_ar: string[] | null
          operation_modes_en: string[] | null
          product_item_id: string
          ratings: Json | null
          sub_description_ar: string
          sub_description_en: string
          tagline_ar: string | null
          tagline_en: string | null
          updated_at: string
        }
        Insert: {
          applications_ar?: string[] | null
          applications_en?: string[] | null
          certifications_ar?: string[] | null
          certifications_en?: string[] | null
          created_at?: string
          description_ar?: string
          description_en?: string
          headline_ar?: string
          headline_en?: string
          id?: string
          is_active?: boolean
          operation_modes_ar?: string[] | null
          operation_modes_en?: string[] | null
          product_item_id: string
          ratings?: Json | null
          sub_description_ar?: string
          sub_description_en?: string
          tagline_ar?: string | null
          tagline_en?: string | null
          updated_at?: string
        }
        Update: {
          applications_ar?: string[] | null
          applications_en?: string[] | null
          certifications_ar?: string[] | null
          certifications_en?: string[] | null
          created_at?: string
          description_ar?: string
          description_en?: string
          headline_ar?: string
          headline_en?: string
          id?: string
          is_active?: boolean
          operation_modes_ar?: string[] | null
          operation_modes_en?: string[] | null
          product_item_id?: string
          ratings?: Json | null
          sub_description_ar?: string
          sub_description_en?: string
          tagline_ar?: string | null
          tagline_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pages_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: true
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_key: string | null
          created_at: string
          description_ar: string
          description_en: string
          homepage_sort_order: number
          icon: string
          id: string
          image_url: string | null
          linked_item_id: string | null
          name_ar: string
          name_en: string
          open_in_new_tab: boolean
          pdf_url: string | null
          show_on_homepage: boolean
          sort_order: number
          tag_ar: string
          tag_en: string
        }
        Insert: {
          category_key?: string | null
          created_at?: string
          description_ar?: string
          description_en?: string
          homepage_sort_order?: number
          icon?: string
          id?: string
          image_url?: string | null
          linked_item_id?: string | null
          name_ar?: string
          name_en?: string
          open_in_new_tab?: boolean
          pdf_url?: string | null
          show_on_homepage?: boolean
          sort_order?: number
          tag_ar?: string
          tag_en?: string
        }
        Update: {
          category_key?: string | null
          created_at?: string
          description_ar?: string
          description_en?: string
          homepage_sort_order?: number
          icon?: string
          id?: string
          image_url?: string | null
          linked_item_id?: string | null
          name_ar?: string
          name_en?: string
          open_in_new_tab?: boolean
          pdf_url?: string | null
          show_on_homepage?: boolean
          sort_order?: number
          tag_ar?: string
          tag_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_linked_item_id_fkey"
            columns: ["linked_item_id"]
            isOneToOne: false
            referencedRelation: "product_items"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description_ar: string
          description_en: string
          icon: string
          id: string
          image_url: string | null
          name_ar: string
          name_en: string
          pdf_url: string | null
          sort_order: number
          tag_ar: string
          tag_en: string
        }
        Insert: {
          created_at?: string
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string
          pdf_url?: string | null
          sort_order?: number
          tag_ar?: string
          tag_en?: string
        }
        Update: {
          created_at?: string
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string
          pdf_url?: string | null
          sort_order?: number
          tag_ar?: string
          tag_en?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          id: string
          updated_at: string
          value_ar: string
          value_en: string
        }
        Insert: {
          content_key: string
          id?: string
          updated_at?: string
          value_ar?: string
          value_en?: string
        }
        Update: {
          content_key?: string
          id?: string
          updated_at?: string
          value_ar?: string
          value_en?: string
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
