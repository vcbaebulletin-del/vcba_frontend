// Admin account related types
export interface AdminAccount {
  admin_id?: number;
  email: string;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
  profile: AdminProfile;
}

export interface AdminProfile {
  profile_id?: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  full_name: string;
  phone_number?: string | null;
  department?: string | null;
  position: 'super_admin' | 'professor';
  grade_level?: number | null;
  bio?: string | null;
  profile_picture?: string | null; // Allow null for removed pictures
  profilePicture?: string | null; // API response alias (camelCase)
}

export interface CreateAdminData extends AdminAccount {
  password: string;
}

export interface GetAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  status?: string;
}

export interface GetAdminsResponse {
  success: boolean;
  data: {
    admins: AdminAccount[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message?: string;
}

export interface AdminResponse {
  success: boolean;
  data?: {
    admin?: AdminAccount;
    profilePicture?: string;
  };
  message: string;
}

export interface AdminFormData extends Omit<AdminAccount, 'admin_id' | 'created_at' | 'updated_at'> {
  admin_id?: number;
}

// Form validation errors
export interface AdminFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  position?: string;
  grade_level?: string;
  profile_picture?: string;
  'profile.first_name'?: string;
  'profile.last_name'?: string;
  'profile.phone_number'?: string;
  'profile.position'?: string;
  'profile.grade_level'?: string;
  'profile.profile_picture'?: string;
  // Index signature to allow dynamic field access
  [key: string]: string | undefined;
}
