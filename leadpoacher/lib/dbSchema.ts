// Auto-generated types from Supabase schema
// Project ID: egzuwrukhsfwpturvqvi
// 
// DATABASE SCHEMA FOR COMPETITOR MENTION RESEARCH:
// - companies: Companies/websites that mention competitors (not the competitors themselves)
// - leads: Contact information extracted from companies that mention competitors
// - scrape_jobs: Research jobs for finding competitor mentions across the web

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
      companies: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_name: string | null
          id: string
          note: string | null
          source_url: string | null
          status: string | null
          timestamp: string | null
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          id?: string
          note?: string | null
          source_url?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          id?: string
          note?: string | null
          source_url?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          competitor: string
          completed_at: string | null
          error_message: string | null
          id: string
          leads_found: number | null
          requested_at: string | null
          state: string | null
        }
        Insert: {
          competitor: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_found?: number | null
          requested_at?: string | null
          state?: string | null
        }
        Update: {
          competitor?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_found?: number | null
          requested_at?: string | null
          state?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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

// Type helpers for easier usage - Competitor Mention Research
export type Company = Tables<'companies'>  // Companies that mention competitors
export type Lead = Tables<'leads'>         // Contacts from companies mentioning competitors
export type ResearchJob = Tables<'scrape_jobs'>  // Competitor mention research jobs

export type CompanyInsert = TablesInsert<'companies'>
export type LeadInsert = TablesInsert<'leads'>
export type ResearchJobInsert = TablesInsert<'scrape_jobs'>

export type CompanyUpdate = TablesUpdate<'companies'>
export type LeadUpdate = TablesUpdate<'leads'>
export type ResearchJobUpdate = TablesUpdate<'scrape_jobs'>

// Legacy aliases for backward compatibility
export type ScrapeJob = ResearchJob
export type ScrapeJobInsert = ResearchJobInsert  
export type ScrapeJobUpdate = ResearchJobUpdate 