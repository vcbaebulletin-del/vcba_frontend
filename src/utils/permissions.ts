/**
 * Frontend Position-Based Permissions System
 * Mirrors the backend permission system for consistent UI behavior
 */

import { useMemo } from 'react';
import { User } from '../types/auth.types';

// Define admin positions
export const POSITIONS = {
  SUPER_ADMIN: 'super_admin',
  PROFESSOR: 'professor'
} as const;

export type Position = typeof POSITIONS[keyof typeof POSITIONS];

// Define permission categories
export const PERMISSIONS = {
  // Category & Subcategory Management
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_SUBCATEGORIES: 'manage_subcategories',
  
  // Admin Management
  MANAGE_ADMIN_ACCOUNTS: 'manage_admin_accounts',
  MANAGE_ADMIN_PROFILES: 'manage_admin_profiles',
  
  // System Settings
  MANAGE_SMS_SETTINGS: 'manage_sms_settings',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  
  // Student Management
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENTS: 'view_students',
  
  // Content Management
  CREATE_ANNOUNCEMENTS: 'create_announcements',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  CREATE_CALENDAR_EVENTS: 'create_calendar_events',
  MANAGE_CALENDAR_EVENTS: 'manage_calendar_events',
  CREATE_NEWSFEED_POSTS: 'create_newsfeed_posts',
  
  // Archive Management
  VIEW_ARCHIVE: 'view_archive',
  MANAGE_ARCHIVE: 'manage_archive',
  
  // TV Display Management
  MANAGE_TV_DISPLAY: 'manage_tv_display'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define position-based permissions mapping (mirrors backend)
const POSITION_PERMISSIONS: Record<Position, Permission[]> = {
  [POSITIONS.SUPER_ADMIN]: [
    // Full system access
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_SUBCATEGORIES,
    PERMISSIONS.MANAGE_ADMIN_ACCOUNTS,
    PERMISSIONS.MANAGE_ADMIN_PROFILES,
    PERMISSIONS.MANAGE_SMS_SETTINGS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_CALENDAR_EVENTS,
    PERMISSIONS.MANAGE_CALENDAR_EVENTS,
    PERMISSIONS.CREATE_NEWSFEED_POSTS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.MANAGE_ARCHIVE,
    PERMISSIONS.MANAGE_TV_DISPLAY
  ],
  
  [POSITIONS.PROFESSOR]: [
    // Content creation and student management
    PERMISSIONS.VIEW_STUDENTS, // Can view students
    PERMISSIONS.MANAGE_STUDENTS, // Can manage students (limited to their grade level)
    PERMISSIONS.CREATE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS, // Can manage their own announcements
    PERMISSIONS.CREATE_CALENDAR_EVENTS,
    PERMISSIONS.MANAGE_CALENDAR_EVENTS, // Can manage their own calendar events
    PERMISSIONS.CREATE_NEWSFEED_POSTS,
    PERMISSIONS.VIEW_ARCHIVE, // Read-only archive access
    PERMISSIONS.MANAGE_TV_DISPLAY // Can manage TV display
  ]
};

/**
 * Permission checking utilities
 */
export class PermissionChecker {
  /**
   * Check if a position has a specific permission
   */
  static hasPermission(position: string | undefined, permission: Permission): boolean {
    if (!position || !this.isValidPosition(position)) {
      return false;
    }
    
    const positionPermissions = POSITION_PERMISSIONS[position as Position] || [];
    return positionPermissions.includes(permission);
  }
  
  /**
   * Check if a user has a specific permission
   */
  static userHasPermission(user: User | null, permission: Permission): boolean {
    if (!user || !user.position) {
      return false;
    }
    
    return this.hasPermission(user.position, permission);
  }
  
  /**
   * Check if a position can access admin management features
   */
  static canManageAdmins(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_ADMIN_ACCOUNTS);
  }
  
  /**
   * Check if a position can manage categories/subcategories
   */
  static canManageCategories(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_CATEGORIES);
  }
  
  /**
   * Check if a position can manage system settings
   */
  static canManageSystemSettings(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_SYSTEM_SETTINGS);
  }
  
  /**
   * Check if a position can fully manage students (create, update, delete)
   */
  static canManageStudents(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_STUDENTS);
  }
  
  /**
   * Check if a position can view students (read-only)
   */
  static canViewStudents(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.VIEW_STUDENTS);
  }
  
  /**
   * Check if a position can manage SMS settings
   */
  static canManageSMSSettings(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_SMS_SETTINGS);
  }
  
  /**
   * Check if a position can create announcements
   */
  static canCreateAnnouncements(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.CREATE_ANNOUNCEMENTS);
  }
  
  /**
   * Check if a position can create calendar events
   */
  static canCreateCalendarEvents(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.CREATE_CALENDAR_EVENTS);
  }
  
  /**
   * Check if a position can manage TV display
   */
  static canManageTVDisplay(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.MANAGE_TV_DISPLAY);
  }
  
  /**
   * Check if a position can view archive
   */
  static canViewArchive(position: string | undefined): boolean {
    return this.hasPermission(position, PERMISSIONS.VIEW_ARCHIVE);
  }
  
  /**
   * Get all permissions for a position
   */
  static getPositionPermissions(position: string | undefined): Permission[] {
    if (!position || !this.isValidPosition(position)) {
      return [];
    }
    
    return POSITION_PERMISSIONS[position as Position] || [];
  }
  
  /**
   * Validate if a position is valid
   */
  static isValidPosition(position: string): position is Position {
    return Object.values(POSITIONS).includes(position as Position);
  }
  
  /**
   * Check if user is super admin
   */
  static isSuperAdmin(user: User | null): boolean {
    return user?.position === POSITIONS.SUPER_ADMIN;
  }
  
  /**
   * Check if user is professor
   */
  static isProfessor(user: User | null): boolean {
    return user?.position === POSITIONS.PROFESSOR;
  }
  
  /**
   * Get user position display name
   */
  static getPositionDisplayName(position: string | undefined): string {
    switch (position) {
      case POSITIONS.SUPER_ADMIN:
        return 'Super Administrator';
      case POSITIONS.PROFESSOR:
        return 'Professor';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Get position badge color for UI
   */
  static getPositionBadgeColor(position: string | undefined): string {
    switch (position) {
      case POSITIONS.SUPER_ADMIN:
        return '#dc2626'; // Red for super admin
      case POSITIONS.PROFESSOR:
        return '#2563eb'; // Blue for professor
      default:
        return '#6b7280'; // Gray for unknown
    }
  }
}

/**
 * Hook for using permissions in React components
 */
export const usePermissions = (user: User | null) => {
  return useMemo(() => ({
    // Position checks
    isSuperAdmin: PermissionChecker.isSuperAdmin(user),
    isProfessor: PermissionChecker.isProfessor(user),

    // Permission checks
    canManageAdmins: PermissionChecker.canManageAdmins(user?.position),
    canManageCategories: PermissionChecker.canManageCategories(user?.position),
    canManageSystemSettings: PermissionChecker.canManageSystemSettings(user?.position),
    canManageStudents: PermissionChecker.canManageStudents(user?.position),
    canViewStudents: PermissionChecker.canViewStudents(user?.position),
    canManageSMSSettings: PermissionChecker.canManageSMSSettings(user?.position),
    canCreateAnnouncements: PermissionChecker.canCreateAnnouncements(user?.position),
    canCreateCalendarEvents: PermissionChecker.canCreateCalendarEvents(user?.position),
    canManageTVDisplay: PermissionChecker.canManageTVDisplay(user?.position),
    canViewArchive: PermissionChecker.canViewArchive(user?.position),

    // Utility functions
    hasPermission: (permission: Permission) => PermissionChecker.userHasPermission(user, permission),
    getPositionDisplayName: () => PermissionChecker.getPositionDisplayName(user?.position),
    getPositionBadgeColor: () => PermissionChecker.getPositionBadgeColor(user?.position),
  }), [user?.position, user?.id]); // Only re-compute when user position or ID changes
};

export default PermissionChecker;
