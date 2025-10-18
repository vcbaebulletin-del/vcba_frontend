import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentService, CreateStudentRequest, Student, StudentsResponse } from '../../services/studentService';
import { AlertTriangle, RefreshCw, Edit, Key, Trash2, Info, User, Users, Search, X } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usePermissions } from '../../utils/permissions';
import { getImageUrl } from '../../config/constants';
import SuffixDropdown, { suffixUtils } from '../../components/common/SuffixDropdown';

// Import PH address data for cascading dropdowns
import regionsDataImport from '../../data/ph-addresses/region.json';
import provincesDataImport from '../../data/ph-addresses/province.json';
import citiesDataImport from '../../data/ph-addresses/city.json';
import barangaysDataImport from '../../data/ph-addresses/barangay.json';

// Type assertion for JSON imports
const regionsData = regionsDataImport as any[];
const provincesData = provincesDataImport as any[];
const citiesData = citiesDataImport as any[];
const barangaysData = barangaysDataImport as any[];

const StudentManagement: React.FC = () => {
  // Auth context
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Get available grade levels based on admin's position and assigned grade
  const getAvailableGradeLevels = () => {
    if (permissions.isSuperAdmin) {
      // Super admin can manage all grades
      return [11, 12];
    } else if (user?.grade_level) {
      // Grade-specific professor can only manage their assigned grade
      return [user.grade_level];
    } else {
      // Default to grades 11 and 12
      return [11, 12];
    }
  };

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states for creating/editing student
  const [formData, setFormData] = useState({
    studentNumber: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    phoneNumber: '',
    gradeLevel: permissions.isProfessor && user?.grade_level ? user.grade_level : 11,
    parentGuardianName: '',
    parentGuardianPhone: '',
    address: ''
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address component states (for cascading dropdowns)
  const [addressFields, setAddressFields] = useState({
    houseNo: '',
    street: '',
    region: '',
    province: '',
    city: '',
    barangay: ''
  });

  // Filtered address options based on selections
  const [filteredProvinces, setFilteredProvinces] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [filteredBarangays, setFilteredBarangays] = useState<any[]>([]);

  // Ensure professor's grade level is set dynamically
  useEffect(() => {
    if (permissions.isProfessor && user?.grade_level) {
      setFormData((prev) => ({
        ...prev,
        gradeLevel: user.grade_level!
      }));
    }
  }, [permissions.isProfessor, user]);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Helper function to load all students in batches
  const loadAllStudentsInBatches = useCallback(async () => {
    const allStudents: Student[] = [];
    let currentPageBatch = 1;
    let hasMoreData = true;
    const batchSize = 50; // Safe batch size

    while (hasMoreData) {
      const params: any = {
        page: currentPageBatch,
        limit: batchSize,
        search: '', // No search in batch loading - we'll filter client-side
      };

      // Add status filter if not 'all'
      if (filterStatus === 'active') {
        params.is_active = true;
      } else if (filterStatus === 'inactive') {
        params.is_active = false;
      }

      // Add grade level filter based on position and assigned grade
      if (permissions.isSuperAdmin) {
        // Super admin can see ALL students regardless of grade level
        // Don't add grade_level filter parameter
      } else if (user?.grade_level) {
        // Professor with assigned grade level can only see their grade
        params.grade_level = user.grade_level;
      }

      const response = await studentService.getStudents(params);

      if (response.students && response.students.length > 0) {
        allStudents.push(...response.students);

        // Check if we have more pages
        const totalPages = response.pagination.totalPages;
        hasMoreData = currentPageBatch < totalPages;
        currentPageBatch++;
      } else {
        hasMoreData = false;
      }
    }

    return allStudents;
  }, [filterStatus, user, permissions.isSuperAdmin]);

  // Load students data - Load all data once for client-side filtering
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 StudentManagement - Loading all students for client-side filtering');

      const allStudents = await loadAllStudentsInBatches();

      setStudents(allStudents);
      console.log('✅ StudentManagement - Students loaded successfully:', allStudents.length);
    } catch (error: any) {
      console.error('❌ StudentManagement - Error loading students:', error);
      setError(error.message || 'Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [loadAllStudentsInBatches]); // Load all data once, like CategoryManagement

  // Load students when dependencies change
  useEffect(() => {
    // Check if user has permission to view students
    if (!permissions.canViewStudents) {
      setError('You do not have permission to view student information');
      setLoading(false);
      return;
    }

    loadStudents();
  }, [loadStudents, permissions.canViewStudents]);

  // Client-side filtering using useMemo (like CategoryManagement)
  const filteredAndPaginatedData = useMemo(() => {
    // Filter students based on search query and status filter
    const filteredStudents = students.filter(student => {
      const matchesSearch = searchQuery.trim() === '' ||
        student.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.profile.full_name && student.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && student.is_active) ||
        (filterStatus === 'inactive' && !student.is_active);

      return matchesSearch && matchesStatus;
    });

    // Calculate pagination
    const totalFiltered = filteredStudents.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    return {
      students: paginatedStudents,
      totalItems: totalFiltered,
      totalPages,
      currentPage,
      itemsPerPage
    };
  }, [students, searchQuery, filterStatus, currentPage, itemsPerPage]);

  // Utility functions
  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#22c55e' : '#f59e0b';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Email generation function
  const generateEmail = (studentNumber: string, gradeLevel: string, lastName: string, firstName: string, middleName: string) => {
    if (!studentNumber || !gradeLevel || !lastName || !firstName) {
      return '';
    }

    const firstLetter = firstName.charAt(0).toUpperCase();
    const middleInitial = middleName ? middleName.charAt(0).toUpperCase() : '';
    const cleanLastName = lastName.replace(/\s+/g, '').toLowerCase();

    return `${studentNumber}_${gradeLevel}_${cleanLastName}_${firstLetter}_${middleInitial}@gmail.com`;
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === 'gradeLevel' ? parseInt(value) : value
    };

    // Auto-generate email when required fields are filled
    if (['studentNumber', 'gradeLevel', 'lastName', 'firstName', 'middleName'].includes(name)) {
      const generatedEmail = generateEmail(
        newFormData.studentNumber,
        newFormData.gradeLevel.toString(),
        newFormData.lastName,
        newFormData.firstName,
        newFormData.middleName
      );
      if (generatedEmail) {
        newFormData.email = generatedEmail;
      }
    }

    setFormData(newFormData);
  };

  // Address field handlers with cascading logic
  const handleAddressFieldChange = (field: string, value: string) => {
    const newAddressFields = { ...addressFields, [field]: value };

    // Cascading logic: clear dependent fields when parent changes
    if (field === 'region') {
      newAddressFields.province = '';
      newAddressFields.city = '';
      newAddressFields.barangay = '';
      // Filter provinces by selected region
      const filtered = provincesData.filter((p: any) => p.region_code === value);
      setFilteredProvinces(filtered);
      setFilteredCities([]);
      setFilteredBarangays([]);
    } else if (field === 'province') {
      newAddressFields.city = '';
      newAddressFields.barangay = '';
      // Filter cities by selected province
      const filtered = citiesData.filter((c: any) => c.province_code === value);
      setFilteredCities(filtered);
      setFilteredBarangays([]);
    } else if (field === 'city') {
      newAddressFields.barangay = '';
      // Filter barangays by selected city
      const filtered = barangaysData.filter((b: any) => b.city_code === value);
      setFilteredBarangays(filtered);
    }

    setAddressFields(newAddressFields);
  };

  // Compose address string from address fields
  const composeAddress = () => {
    const { houseNo, street, barangay, city, province, region } = addressFields;
    
    // Get display names instead of codes
    const regionName = regionsData.find((r: any) => r.region_code === region)?.region_name || '';
    const provinceName = provincesData.find((p: any) => p.province_code === province)?.province_name || '';
    const cityName = citiesData.find((c: any) => c.city_code === city)?.city_name || '';
    const barangayName = barangaysData.find((b: any) => b.brgy_code === barangay)?.brgy_name || '';

    // Compose address in specified format with commas: "{houseNo} {street}, {barangay}, {city}, {province}, {region}"
    const parts = [
      houseNo?.trim(),
      street?.trim(),
      barangayName,
      cityName,
      provinceName,
      regionName
    ].filter(part => part); // Remove empty parts

    return parts.join(', ').trim();
  };

  const resetForm = () => {
    setFormData({
      studentNumber: '',
      email: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      phoneNumber: '',
      gradeLevel: permissions.isProfessor && user?.grade_level ? user.grade_level : 11,
      parentGuardianName: '',
      parentGuardianPhone: '',
      address: ''
    });
    setAddressFields({
      houseNo: '',
      street: '',
      region: '',
      province: '',
      city: '',
      barangay: ''
    });
    setFilteredProvinces([]);
    setFilteredCities([]);
    setFilteredBarangays([]);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
  };

  // Profile picture handling functions
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setProfilePictureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove profile picture for create modal (local only)
  const removeProfilePictureLocal = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
  };

  // Remove profile picture for edit modal (calls API for existing students)
  const removeProfilePicture = async () => {
    try {
      // If we're editing an existing student and they have a profile picture, remove it from the server
      if (selectedStudent && selectedStudent.profile.profile_picture) {
        // Confirm before removing
        const confirmed = window.confirm(
          `Are you sure you want to remove ${selectedStudent.profile.full_name}'s profile picture? This action cannot be undone.`
        );

        if (!confirmed) {
          return;
        }

        setLoading(true);
        const updatedStudent = await studentService.removeStudentProfilePicture(selectedStudent.student_id.toString());

        // Update the selected student data immediately
        setSelectedStudent(updatedStudent);

        // Refresh the students list to show the updated data
        await loadStudents();

        alert('Profile picture removed successfully!');
      }

      // Clear local state regardless
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    } catch (error: any) {
      console.error('Error removing profile picture:', error);
      alert(`Failed to remove profile picture: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateStudent = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.studentNumber || !formData.email || !formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.gradeLevel) {
        throw new Error('Please fill in all required fields (First Name, Last Name, Student Number, Email, Phone, Grade Level, Section)');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate suffix if provided
      if (formData.suffix) {
        const suffixValidation = suffixUtils.validateSuffixUsage(
          formData.suffix,
          formData.firstName,
          formData.lastName
        );
        if (!suffixValidation.isValid) {
          throw new Error(suffixValidation.message || 'Invalid suffix selected');
        }
      }

      // Compose address from address fields if any field is filled
      const hasAddressInput = addressFields.houseNo || addressFields.street || addressFields.region || 
                              addressFields.province || addressFields.city || addressFields.barangay;
      const composedAddress = hasAddressInput ? composeAddress() : '';

      // Validate address: at least city or barangay must be selected if any address field is filled
      if (hasAddressInput && !addressFields.city && !addressFields.barangay) {
        throw new Error('Please select at least a city or barangay for the address');
      }

      // Prepare student data for API
      const studentData: CreateStudentRequest = {
        // Account data
        student_number: formData.studentNumber,
        email: formData.email,
        password: 'Student123', // Default password
        is_active: true,
        created_by: user?.id || 1, // Current admin ID

        // Profile data
        first_name: formData.firstName,
        middle_name: formData.middleName || undefined,
        last_name: formData.lastName,
        suffix: formData.suffix || undefined,
        phone_number: formData.phoneNumber,
        grade_level: formData.gradeLevel,
        parent_guardian_name: formData.parentGuardianName || undefined,
        parent_guardian_phone: formData.parentGuardianPhone || undefined,
        address: composedAddress || undefined
      };

      // Debug: Log the data being sent
      console.log('Sending student data:', studentData);

      // Call API to create student
      const createdStudent = await studentService.createStudent(studentData);

      // Upload profile picture if provided
      if (profilePictureFile) {
        try {
          await studentService.uploadStudentProfilePicture(createdStudent.student_id.toString(), profilePictureFile);
        } catch (profileError: any) {
          console.error('Error uploading profile picture:', profileError);
          // Don't fail the entire creation process for profile picture upload failure
          alert(`Student account created successfully, but profile picture upload failed: ${profileError.message}`);
        }
      }

      alert(`Student account created successfully!\n\nStudent Details:\nName: ${createdStudent.profile.full_name}\nStudent Number: ${createdStudent.student_number}\nEmail: ${createdStudent.email}\n\nLogin Credentials:\nEmail: ${createdStudent.email}\nPassword: Student123\n\nPlease share these credentials with the student and ask them to change the password on first login.`);

      resetForm();
      setShowCreateModal(false);

      // Refresh the students list
      await loadStudents();

    } catch (error: any) {
      console.error('Error creating student:', error);
      setError(error.message || 'Failed to create student account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);

    // Debug logging for suffix field
    console.log('🔍 handleEditStudent - Student suffix data:', {
      suffix: student.profile.suffix,
      suffix_type: typeof student.profile.suffix,
      suffix_is_null: student.profile.suffix === null,
      suffix_is_undefined: student.profile.suffix === undefined,
      suffix_is_empty: student.profile.suffix === ''
    });

    // Ensure suffix is properly converted for form display
    const suffixForForm = student.profile.suffix === null || student.profile.suffix === undefined ? '' : student.profile.suffix;

    console.log('🔍 handleEditStudent - Suffix conversion:', {
      original: student.profile.suffix,
      converted: suffixForForm,
      converted_type: typeof suffixForForm
    });

    setFormData({
      studentNumber: student.student_number,
      email: student.email,
      firstName: student.profile.first_name,
      middleName: student.profile.middle_name || '',
      lastName: student.profile.last_name,
      suffix: suffixForForm, // Use explicit conversion
      phoneNumber: student.profile.phone_number,
      gradeLevel: student.profile.grade_level,
      parentGuardianName: student.profile.parent_guardian_name || '',
      parentGuardianPhone: student.profile.parent_guardian_phone || '',
      address: student.profile.address || ''
    });

    // Reset address fields to empty (edit mode shows current address as label only)
    setAddressFields({
      houseNo: '',
      street: '',
      region: '',
      province: '',
      city: '',
      barangay: ''
    });
    setFilteredProvinces([]);
    setFilteredCities([]);
    setFilteredBarangays([]);

    // Set existing profile picture preview
    setProfilePictureFile(null);
    setProfilePicturePreview(student.profile.profile_picture ? getImageUrl(student.profile.profile_picture) : null);

    setShowEditModal(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.studentNumber || !formData.email || !formData.firstName || !formData.lastName || !formData.phoneNumber) {
        throw new Error('Please fill in all required fields (First Name, Last Name, Student Number, Email, Phone)');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate suffix if provided
      if (formData.suffix) {
        const suffixValidation = suffixUtils.validateSuffixUsage(
          formData.suffix,
          formData.firstName,
          formData.lastName
        );
        if (!suffixValidation.isValid) {
          throw new Error(suffixValidation.message || 'Invalid suffix selected');
        }
      }

      // Debug logging for suffix field before update
      console.log('🔍 handleUpdateStudent - Form data before update:', {
        suffix: formData.suffix,
        suffix_type: typeof formData.suffix,
        suffix_is_empty: formData.suffix === '',
        suffix_length: formData.suffix.length
      });

      // Prepare update data with explicit suffix handling
      // CRITICAL: Use null (not undefined) to clear suffix in database
      const suffixForUpdate = formData.suffix === '' ? null : formData.suffix;

      // Handle address update: compose new address if any field is filled, otherwise keep existing
      const hasAddressInput = addressFields.houseNo || addressFields.street || addressFields.region || 
                              addressFields.province || addressFields.city || addressFields.barangay;
      let addressForUpdate = formData.address; // Keep existing by default
      
      if (hasAddressInput) {
        // Validate address: at least city or barangay must be selected
        if (!addressFields.city && !addressFields.barangay) {
          throw new Error('Please select at least a city or barangay for the address');
        }
        addressForUpdate = composeAddress();
      }

      const updateData: Partial<CreateStudentRequest> = {
        student_number: formData.studentNumber,
        email: formData.email,
        first_name: formData.firstName,
        middle_name: formData.middleName || undefined,
        last_name: formData.lastName,
        suffix: suffixForUpdate, // Use explicit null to clear suffix in database
        phone_number: formData.phoneNumber,
        grade_level: formData.gradeLevel,
        parent_guardian_name: formData.parentGuardianName || undefined,
        parent_guardian_phone: formData.parentGuardianPhone || undefined,
        address: addressForUpdate || undefined
      };

      // Debug logging for suffix field after preparation
      console.log('🔍 handleUpdateStudent - Update data prepared:', {
        suffix: updateData.suffix,
        suffix_type: typeof updateData.suffix,
        suffix_is_null: updateData.suffix === null,
        suffix_is_undefined: updateData.suffix === undefined,
        will_clear_suffix: updateData.suffix === null
      });

      // Call API to update student
      console.log('🔍 handleUpdateStudent - Calling API with data:', updateData);
      const updatedStudent = await studentService.updateStudent(selectedStudent.student_id.toString(), updateData);

      console.log('🔍 handleUpdateStudent - API response:', {
        updated_student: updatedStudent,
        updated_suffix: updatedStudent?.profile?.suffix,
        updated_full_name: updatedStudent?.profile?.full_name
      });

      // Handle profile picture upload if a new file was selected
      if (profilePictureFile) {
        try {
          await studentService.uploadStudentProfilePicture(selectedStudent.student_id.toString(), profilePictureFile);
        } catch (profileError: any) {
          console.error('Error uploading profile picture:', profileError);
          alert(`Student information updated successfully, but profile picture upload failed: ${profileError.message}`);
        }
      }

      alert('Student information updated successfully!');

      resetForm();
      setShowEditModal(false);
      setSelectedStudent(null);

      // Refresh the students list
      console.log('🔍 handleUpdateStudent - Refreshing students list...');
      await loadStudents();
      console.log('🔍 handleUpdateStudent - Students list refreshed');

    } catch (error: any) {
      console.error('Error updating student:', error);
      setError(error.message || 'Failed to update student information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleResetPassword = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${student.profile.full_name}?\n\nThe password will be reset to: Student123`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await studentService.resetStudentPassword(student.student_id.toString());

      // Show success message
      alert(`Password reset successfully for ${student.profile.full_name}!\n\nNew password: Student123`);

    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Failed to reset password: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call API to soft delete student (deactivate)
      await studentService.deleteStudent(selectedStudent.student_id.toString());

      alert('Student account has been deactivated successfully!');

      setShowDeleteModal(false);
      setSelectedStudent(null);

      // Refresh the students list
      await loadStudents();

    } catch (error: any) {
      console.error('Error deleting student:', error);
      setError(error.message || 'Failed to deactivate student account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredAndPaginatedData.students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredAndPaginatedData.students.map(s => s.student_id));
    }
  };

  const handleSelectStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${selectedStudents.length} student(s)?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await studentService.bulkDeactivateStudents(selectedStudents);
      alert(`Successfully deactivated ${selectedStudents.length} student(s)!`);
      setSelectedStudents([]);
      await loadStudents();
    } catch (error: any) {
      console.error('Error bulk deactivating students:', error);
      alert(`Failed to deactivate students: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check permissions first
  if (!permissions.canViewStudents) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <Users size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Access Denied
        </h2>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          You do not have permission to view student information.
        </p>
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: permissions.getPositionBadgeColor(),
          borderRadius: '6px',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          Current Role: {permissions.getPositionDisplayName()}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '1.1rem'
          }}>
            {permissions.isSuperAdmin
              ? 'Create, edit, and manage student accounts across all grades'
              : permissions.isProfessor
                ? 'Create, edit, and manage student accounts in your assigned grade'
                : 'View student information (read-only)'
            }
            {permissions.isSuperAdmin && (
              <span style={{
                display: 'inline-block',
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                All Grades
              </span>
            )}
            {permissions.isProfessor && user?.grade_level && (
              <span style={{
                display: 'inline-block',
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Grade {user.grade_level} Only
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Create Student Account Button - Only for super_admin */}
          {permissions.canManageStudents && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #2d5016 0%, #4ade80 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1rem' }}>+</span>
              Add Student
            </button>
          )}

          {/* Bulk Deactivate Button - Only for super_admin and when students are selected */}
          {permissions.canManageStudents && selectedStudents.length > 0 && (
            <button
              onClick={handleBulkDeactivate}
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              Deactivate ({selectedStudents.length})
            </button>
          )}

          {/* Search */}
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Search students by name, email, or student number..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Buttons */}
          {/* <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>Filter:</span>
            <button
              onClick={() => handleStatusFilterChange('all')}
              style={{
                padding: '0.5rem 1rem',
                border: filterStatus === 'all' ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.85rem',
                backgroundColor: filterStatus === 'all' ? '#4CAF50' : '#fff',
                color: filterStatus === 'all' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: filterStatus === 'all' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilterChange('active')}
              style={{
                padding: '0.5rem 1rem',
                border: filterStatus === 'active' ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.85rem',
                backgroundColor: filterStatus === 'active' ? '#4CAF50' : '#fff',
                color: filterStatus === 'active' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: filterStatus === 'active' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusFilterChange('inactive')}
              style={{
                padding: '0.5rem 1rem',
                border: filterStatus === 'inactive' ? '2px solid #f44336' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.85rem',
                backgroundColor: filterStatus === 'inactive' ? '#f44336' : '#fff',
                color: filterStatus === 'inactive' ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: filterStatus === 'inactive' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              Inactive
            </button>
          </div> */}
        </div>
      </div>

      {/* Students Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          background: '#f8fdf8',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e8f5e8',
          display: 'grid',
          gridTemplateColumns: '40px 60px 1fr 2fr 2fr 1fr 1fr 1fr 150px',
          gap: '1rem',
          fontWeight: '600',
          color: '#2d5016',
          fontSize: '0.875rem',
          alignItems: 'center'
        }}>
          {permissions.canManageStudents && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={selectedStudents.length === filteredAndPaginatedData.students.length && filteredAndPaginatedData.students.length > 0}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </div>
          )}
          <div>Photo</div>
          <div>Student #</div>
          <div>Name</div>
          <div>Email</div>
          <div>Grade</div>
          <div>Phone</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            Loading students...
          </div>
        ) : filteredAndPaginatedData.students.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No students found. {searchQuery && 'Try adjusting your search criteria.'}
          </div>
        ) : (
          filteredAndPaginatedData.students.map(student => (
            <div
              key={student.student_id}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #f3f4f6',
                display: 'grid',
                gridTemplateColumns: '40px 60px 1fr 2fr 2fr 1fr 1fr 1fr 150px',
                gap: '1rem',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}
            >
              {permissions.canManageStudents && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.student_id)}
                    onChange={() => handleSelectStudent(student.student_id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {student.profile.profile_picture ? (
                  <img
                    src={getImageUrl(student.profile.profile_picture) || ''}
                    alt={`${student.profile.full_name} profile`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e8f5e8'
                    }}
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background-color: #f3f4f6;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #6b7280;
                            font-size: 0.75rem;
                            font-weight: 600;
                          ">
                            ${student.profile.first_name.charAt(0)}${student.profile.last_name.charAt(0)}
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {student.profile.first_name.charAt(0)}{student.profile.last_name.charAt(0)}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: '600', color: '#2d5016' }}>
                {student.student_number}
              </div>
              <div style={{ color: '#374151' }}>
                {student.profile.full_name}
              </div>
              <div style={{ color: '#6b7280' }}>
                {student.email}
              </div>
              <div style={{ color: '#374151' }}>
                Grade {student.profile.grade_level}
              </div>
              <div style={{ color: '#374151' }}>
                {student.profile.phone_number}
              </div>
              <div>
                <span style={{
                  background: getStatusColor(student.is_active),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {getStatusText(student.is_active)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {permissions.canManageStudents ? (
                  <>
                    <button
                      onClick={() => handleEditStudent(student)}
                      title="Edit Student"
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(student)}
                      title="Reset Password to Default (Student123)"
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Key size={16} />
                    </button>
                    {permissions.isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        title="Deactivate Student"
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    View Only
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {filteredAndPaginatedData.totalPages > 1 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Showing {filteredAndPaginatedData.students.length} of {filteredAndPaginatedData.totalItems} students
              {searchQuery && ` (filtered by "${searchQuery}")`}
              {filterStatus !== 'all' && ` (${filterStatus} only)`}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#f3f4f6' : '#2d5016',
                  color: currentPage === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === filteredAndPaginatedData.totalPages}
                style={{
                  background: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : '#2d5016',
                  color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Student Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '95%',
            maxWidth: '1200px',
            maxHeight: '95vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#2d5016',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Create New Student Account
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateStudent(); }} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                height: 'fit-content'
              }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Profile Picture Upload */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Profile Picture
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e8f5e8'
                          }}
                          onError={(e) => {
                            console.error('Profile picture preview failed to load:', profilePicturePreview);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div style="
                                  width: 80px;
                                  height: 80px;
                                  border-radius: 50%;
                                  background-color: #f3f4f6;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: #6b7280;
                                  font-size: 0.875rem;
                                ">
                                  No Photo
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          No Photo
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                        {profilePicturePreview && (
                          <button
                            type="button"
                            onClick={removeProfilePictureLocal}
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Number */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Student Number *
                    </label>
                    <input
                      type="text"
                      name="studentNumber"
                      value={formData.studentNumber}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="e.g., 2025-0001"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Email Address * (Auto-generated)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280'
                      }}
                      placeholder="Email will be auto-generated based on student details"
                    />
                  </div>

                {/* Name Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* First Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Juan"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Cruz"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Middle Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Dela"
                    />
                  </div>

                  {/* Suffix */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Suffix
                    </label>
                    <SuffixDropdown
                      value={formData.suffix}
                      onChange={(value) => {
                        console.log('🔍 SuffixDropdown onChange - Create form:', {
                          old_value: formData.suffix,
                          new_value: value,
                          value_type: typeof value,
                          is_empty_string: value === '',
                          is_null: value === null,
                          is_undefined: value === undefined
                        });
                        setFormData(prev => ({ ...prev, suffix: value }));
                      }}
                      placeholder="Select suffix (optional)"
                      id="create-student-suffix"
                      name="suffix"
                    />
                  </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onInput={(e) => {
                        // Allow only numbers and limit to 11 digits
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 11);
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                    />
                  </div>

                  {/* Grade Level */}
                  <div
                    style={{
                      display: permissions.isProfessor ? 'none' : 'block'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}
                    >
                      Grade Level *
                    </label>
                    <select
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    >
                      {getAvailableGradeLevels().map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>



                  {/* Parent/Guardian Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Parent/Guardian Name
                    </label>
                    <input
                      type="text"
                      name="parentGuardianName"
                      value={formData.parentGuardianName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Parent/Guardian Name"
                    />
                  </div>

                  {/* Parent/Guardian Phone */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Parent/Guardian Phone
                    </label>
                    <input
                      type="tel"
                      name="parentGuardianPhone"
                      value={formData.parentGuardianPhone}
                      onChange={handleInputChange}
                      onInput={(e) => {
                        // Allow only numbers and limit to 13 digits
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 13);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="09XXXXXXXXX"
                      maxLength={13}
                    />
                  </div>

                  {/* Address - Cascading Dropdowns */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Address
                    </label>
                    
                    {/* House No and Street */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={addressFields.houseNo}
                        onChange={(e) => handleAddressFieldChange('houseNo', e.target.value)}
                        placeholder="House No."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                      <input
                        type="text"
                        value={addressFields.street}
                        onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                        placeholder="Street"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {/* Region */}
                    <select
                      value={addressFields.region}
                      onChange={(e) => handleAddressFieldChange('region', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Select Region</option>
                      {regionsData.map((region: any) => (
                        <option key={region.region_code} value={region.region_code}>
                          {region.region_name}
                        </option>
                      ))}
                    </select>

                    {/* Province */}
                    <select
                      value={addressFields.province}
                      onChange={(e) => handleAddressFieldChange('province', e.target.value)}
                      disabled={!addressFields.region}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: addressFields.region ? 'white' : '#f9fafb',
                        cursor: addressFields.region ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select Province</option>
                      {filteredProvinces.map((province: any) => (
                        <option key={province.province_code} value={province.province_code}>
                          {province.province_name}
                        </option>
                      ))}
                    </select>

                    {/* City/Municipality */}
                    <select
                      value={addressFields.city}
                      onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                      disabled={!addressFields.province}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: addressFields.province ? 'white' : '#f9fafb',
                        cursor: addressFields.province ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select City/Municipality</option>
                      {filteredCities.map((city: any) => (
                        <option key={city.city_code} value={city.city_code}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>

                    {/* Barangay */}
                    <select
                      value={addressFields.barangay}
                      onChange={(e) => handleAddressFieldChange('barangay', e.target.value)}
                      disabled={!addressFields.city}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: addressFields.city ? 'white' : '#f9fafb',
                        cursor: addressFields.city ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select Barangay</option>
                      {filteredBarangays.map((barangay: any) => (
                        <option key={barangay.brgy_code} value={barangay.brgy_code}>
                          {barangay.brgy_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Password Info */}
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Info size={20} color="#0369a1" />
                      <span style={{ fontWeight: '600', color: '#0369a1' }}>Default Login Credentials</span>
                    </div>
                    <p style={{ margin: 0, color: '#0369a1', fontSize: '0.875rem' }}>
                      The student account will be created with the default password: <strong>Student123</strong>
                      <br />
                      Please share these credentials with the student and ask them to change the password on first login.
                    </p>
                  </div>
                </div>

                {/* Form Actions - Spans both columns */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #2d5016 0%, #4ade80 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Student Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '95%',
            maxWidth: '1200px',
            maxHeight: '95vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#2d5016',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Edit Student: {selectedStudent.profile.full_name}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedStudent(null);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateStudent(); }} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                height: 'fit-content'
              }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Profile Picture Upload */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Profile Picture
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e8f5e8'
                          }}
                          onError={(e) => {
                            console.error('Edit modal profile picture preview failed to load:', profilePicturePreview);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div style="
                                  width: 80px;
                                  height: 80px;
                                  border-radius: 50%;
                                  background-color: #f3f4f6;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: #6b7280;
                                  font-size: 0.875rem;
                                ">
                                  No Photo
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          No Photo
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {profilePicturePreview && (
                            <button
                              type="button"
                              onClick={removeProfilePicture}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Remove Picture
                            </button>
                          )}
                          {/* {selectedStudent?.profile.profile_picture && !profilePictureFile && (
                            <button
                              type="button"
                              onClick={removeProfilePicture}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Remove Current Picture
                            </button>
                          )} */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Number */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Student Number *
                    </label>
                    <input
                      type="text"
                      name="studentNumber"
                      value={formData.studentNumber}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="e.g., 2025-0001"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Email Address * (Auto-generated)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280'
                      }}
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Juan"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Cruz"
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Dela"
                    />
                  </div>

                  {/* Suffix */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Suffix
                    </label>
                    <SuffixDropdown
                      value={formData.suffix}
                      onChange={(value) => {
                        console.log('🔍 SuffixDropdown onChange - Edit form:', {
                          old_value: formData.suffix,
                          new_value: value,
                          value_type: typeof value,
                          is_empty_string: value === '',
                          is_null: value === null,
                          is_undefined: value === undefined
                        });

                        // Update form data with new suffix value
                        setFormData(prev => {
                          const newFormData = { ...prev, suffix: value };
                          console.log('🔍 SuffixDropdown onChange - Updated form data:', {
                            suffix: newFormData.suffix,
                            suffix_type: typeof newFormData.suffix
                          });
                          return newFormData;
                        });
                      }}
                      placeholder="Select suffix (optional)"
                      id="edit-student-suffix"
                      name="suffix"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onInput={(e) => {
                        // Allow only numbers and limit to 11 digits
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 11);
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      maxLength={11}
                    />
                  </div>

                  {/* Grade Level */}
                  <div
                    style={{
                      display: permissions.isProfessor ? 'none' : 'block'
                    }}
                  >
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Grade Level *
                    </label>
                    <select
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white'
                      }}
                    >
                      {getAvailableGradeLevels().map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>



                  {/* Parent/Guardian Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Parent/Guardian Name
                    </label>
                    <input
                      type="text"
                      name="parentGuardianName"
                      value={formData.parentGuardianName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Parent/Guardian Phone */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Parent/Guardian Phone
                    </label>
                    <input
                      type="tel"
                      name="parentGuardianPhone"
                      value={formData.parentGuardianPhone}
                      onChange={handleInputChange}
                      onInput={(e) => {
                        // Allow only numbers and limit to 13 digits
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 13);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      maxLength={13}
                    />
                  </div>

                  {/* Address - Cascading Dropdowns with Current Address Label */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Address
                    </label>
                    
                    {/* Current Address Display (Edit Mode Only) */}
                    {formData.address && (
                      <div style={{
                        padding: '0.75rem',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        marginBottom: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{ fontWeight: '600', color: '#0369a1' }}>Current Address: </span>
                        <span style={{ color: '#374151' }}>{formData.address}</span>
                      </div>
                    )}
                    
                    {/* House No and Street */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={addressFields.houseNo}
                        onChange={(e) => handleAddressFieldChange('houseNo', e.target.value)}
                        placeholder="House No."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                      <input
                        type="text"
                        value={addressFields.street}
                        onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                        placeholder="Street"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    {/* Region */}
                    <select
                      value={addressFields.region}
                      onChange={(e) => handleAddressFieldChange('region', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Select Region</option>
                      {regionsData.map((region: any) => (
                        <option key={region.region_code} value={region.region_code}>
                          {region.region_name}
                        </option>
                      ))}
                    </select>

                    {/* Province */}
                    <select
                      value={addressFields.province}
                      onChange={(e) => handleAddressFieldChange('province', e.target.value)}
                      disabled={!addressFields.region}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: addressFields.region ? 'white' : '#f9fafb',
                        cursor: addressFields.region ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select Province</option>
                      {filteredProvinces.map((province: any) => (
                        <option key={province.province_code} value={province.province_code}>
                          {province.province_name}
                        </option>
                      ))}
                    </select>

                    {/* City/Municipality */}
                    <select
                      value={addressFields.city}
                      onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                      disabled={!addressFields.province}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        backgroundColor: addressFields.province ? 'white' : '#f9fafb',
                        cursor: addressFields.province ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select City/Municipality</option>
                      {filteredCities.map((city: any) => (
                        <option key={city.city_code} value={city.city_code}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>

                    {/* Barangay */}
                    <select
                      value={addressFields.barangay}
                      onChange={(e) => handleAddressFieldChange('barangay', e.target.value)}
                      disabled={!addressFields.city}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: addressFields.city ? 'white' : '#f9fafb',
                        cursor: addressFields.city ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select Barangay</option>
                      {filteredBarangays.map((barangay: any) => (
                        <option key={barangay.brgy_code} value={barangay.brgy_code}>
                          {barangay.brgy_name}
                        </option>
                      ))}
                    </select>
                    
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Leave fields empty to keep current address. Fill to update.
                    </p>
                  </div>
                </div>

                {/* Form Actions - Spans both columns */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStudent(null);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #2d5016 0%, #4ade80 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#dc2626',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Deactivate Student Account
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStudent(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                Are you sure you want to deactivate the account for:
              </p>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#2d5016' }}>
                  {selectedStudent.profile.full_name}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Student Number: {selectedStudent.student_number}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Email: {selectedStudent.email}
                </p>
              </div>
              <p style={{ margin: '1rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <AlertTriangle size={16} color="#dc2626" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                  This action will deactivate the student's account. They will not be able to log in until reactivated.
                </span>
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStudent(null);
                }}
                disabled={isSubmitting}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStudent}
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;