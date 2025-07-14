// Generated types from Supabase - these should be kept in sync with the mobile app
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'client' | 'admin' | 'contractor' | 'inspector'
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          role?: 'client' | 'admin' | 'contractor' | 'inspector'
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: 'client' | 'admin' | 'contractor' | 'inspector'
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          project_name: string
          project_address: string
          contract_value: number
          start_date: string
          expected_completion: string
          actual_completion: string | null
          current_phase: string
          progress_percentage: number
          status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
          description: string | null
          project_photo_urls: string[] | null
          weather_location: string | null
          total_milestones: number
          completed_milestones: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          project_name: string
          project_address: string
          contract_value: number
          start_date: string
          expected_completion: string
          actual_completion?: string | null
          current_phase?: string
          progress_percentage?: number
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
          description?: string | null
          project_photo_urls?: string[] | null
          weather_location?: string | null
          total_milestones?: number
          completed_milestones?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          project_name?: string
          project_address?: string
          contract_value?: number
          start_date?: string
          expected_completion?: string
          actual_completion?: string | null
          current_phase?: string
          progress_percentage?: number
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
          description?: string | null
          project_photo_urls?: string[] | null
          weather_location?: string | null
          total_milestones?: number
          completed_milestones?: number
          created_at?: string
          updated_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          contractor_name: string
          company_name: string
          primary_contact_name: string
          email: string
          phone: string
          trade_specialization: string
          overall_rating: number
          contractor_source: 'user_added' | 'korabuild_verified' | 'platform_recommended' | 'referral'
          status: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'pending_approval'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_name: string
          company_name: string
          primary_contact_name: string
          email: string
          phone: string
          trade_specialization: string
          overall_rating?: number
          contractor_source?: 'user_added' | 'korabuild_verified' | 'platform_recommended' | 'referral'
          status?: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'pending_approval'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_name?: string
          company_name?: string
          primary_contact_name?: string
          email?: string
          phone?: string
          trade_specialization?: string
          overall_rating?: number
          contractor_source?: 'user_added' | 'korabuild_verified' | 'platform_recommended' | 'referral'
          status?: 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'pending_approval'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          project_id: string
          milestone_id: string | null
          amount: number
          payment_date: string
          payment_method: string
          reference: string
          description: string
          receipt_url: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_category: 'milestone' | 'materials' | 'labor' | 'permits' | 'other'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          milestone_id?: string | null
          amount: number
          payment_date: string
          payment_method: string
          reference: string
          description: string
          receipt_url?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          milestone_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: string
          reference?: string
          description?: string
          receipt_url?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other'
          created_at?: string
          updated_at?: string
        }
      }
      // Add more tables as needed...
      project_milestones: {
        Row: {
          id: string
          project_id: string
          milestone_name: string
          description: string | null
          phase_category: string
          planned_start: string | null
          planned_end: string | null
          actual_start: string | null
          actual_end: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold'
          progress_percentage: number
          photos: string[] | null
          notes: string | null
          order_index: number
          estimated_cost: number | null
          actual_cost: number | null
          responsible_contractor: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          milestone_name: string
          description?: string | null
          phase_category?: string
          planned_start?: string | null
          planned_end?: string | null
          actual_start?: string | null
          actual_end?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold'
          progress_percentage?: number
          photos?: string[] | null
          notes?: string | null
          order_index?: number
          estimated_cost?: number | null
          actual_cost?: number | null
          responsible_contractor?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          milestone_name?: string
          description?: string | null
          phase_category?: string
          planned_start?: string | null
          planned_end?: string | null
          actual_start?: string | null
          actual_end?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold'
          progress_percentage?: number
          photos?: string[] | null
          notes?: string | null
          order_index?: number
          estimated_cost?: number | null
          actual_cost?: number | null
          responsible_contractor?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_photos: {
        Row: {
          id: string
          project_id: string
          milestone_id: string | null
          photo_url: string
          photo_title: string | null
          description: string | null
          phase_category: string
          photo_type: string
          date_taken: string
          uploaded_by: string | null
          gps_coordinates: string | null
          weather_conditions: string | null
          camera_settings: Record<string, any> | null
          file_size_bytes: number | null
          image_dimensions: Record<string, any> | null
          compression_ratio: number | null
          hash_checksum: string | null
          is_featured: boolean
          likes_count: number
          views_count: number
          tags: string[] | null
          annotation_data: Record<string, any> | null
          processing_status: string
          quality_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          milestone_id?: string | null
          photo_url: string
          photo_title?: string | null
          description?: string | null
          phase_category: string
          photo_type?: string
          date_taken?: string
          uploaded_by?: string | null
          gps_coordinates?: string | null
          weather_conditions?: string | null
          camera_settings?: Record<string, any> | null
          file_size_bytes?: number | null
          image_dimensions?: Record<string, any> | null
          compression_ratio?: number | null
          hash_checksum?: string | null
          is_featured?: boolean
          likes_count?: number
          views_count?: number
          tags?: string[] | null
          annotation_data?: Record<string, any> | null
          processing_status?: string
          quality_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          milestone_id?: string | null
          photo_url?: string
          photo_title?: string | null
          description?: string | null
          phase_category?: string
          photo_type?: string
          date_taken?: string
          uploaded_by?: string | null
          gps_coordinates?: string | null
          weather_conditions?: string | null
          camera_settings?: Record<string, any> | null
          file_size_bytes?: number | null
          image_dimensions?: Record<string, any> | null
          compression_ratio?: number | null
          hash_checksum?: string | null
          is_featured?: boolean
          likes_count?: number
          views_count?: number
          tags?: string[] | null
          annotation_data?: Record<string, any> | null
          processing_status?: string
          quality_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      project_updates: {
        Row: {
          id: string
          project_id: string
          milestone_id: string | null
          update_type: string
          title: string
          description: string | null
          photo_urls: string[] | null
          metadata: Record<string, any> | null
          created_by: string | null
          created_at: string
          photo_ids: string[] | null
          update_priority: string
          is_pinned: boolean
          visibility: string
        }
        Insert: {
          id?: string
          project_id: string
          milestone_id?: string | null
          update_type: string
          title: string
          description?: string | null
          photo_urls?: string[] | null
          metadata?: Record<string, any> | null
          created_by?: string | null
          created_at?: string
          photo_ids?: string[] | null
          update_priority?: string
          is_pinned?: boolean
          visibility?: string
        }
        Update: {
          id?: string
          project_id?: string
          milestone_id?: string | null
          update_type?: string
          title?: string
          description?: string | null
          photo_urls?: string[] | null
          metadata?: Record<string, any> | null
          created_by?: string | null
          created_at?: string
          photo_ids?: string[] | null
          update_priority?: string
          is_pinned?: boolean
          visibility?: string
        }
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
  }
}

// Helper types for the admin dashboard
export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Contractor = Database['public']['Tables']['contractors']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type ProjectMilestone = Database['public']['Tables']['project_milestones']['Row']
export type ProjectPhoto = Database['public']['Tables']['project_photos']['Row']
export type ProjectUpdate = Database['public']['Tables']['project_updates']['Row']

export type CreateUser = Database['public']['Tables']['users']['Insert']
export type UpdateUser = Database['public']['Tables']['users']['Update']
export type CreateProject = Database['public']['Tables']['projects']['Insert']
export type UpdateProject = Database['public']['Tables']['projects']['Update'] 
export type CreateProjectMilestone = Database['public']['Tables']['project_milestones']['Insert']
export type UpdateProjectMilestone = Database['public']['Tables']['project_milestones']['Update']
export type CreateProjectPhoto = Database['public']['Tables']['project_photos']['Insert']
export type UpdateProjectPhoto = Database['public']['Tables']['project_photos']['Update']
export type CreateProjectUpdate = Database['public']['Tables']['project_updates']['Insert']
export type UpdateProjectUpdate = Database['public']['Tables']['project_updates']['Update'] 