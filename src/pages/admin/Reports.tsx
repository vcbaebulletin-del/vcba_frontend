import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { adminHttpClient } from '../../services/api.service';
import { API_BASE_URL } from '../../config/constants';
import {
  Download,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Image,
  Clock,
  Filter,
  Settings,
  Eye,
  Sparkles,
  Activity,
  CalendarDays,
  CalendarRange,
  Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Reports.module.css';

// Philippines timezone utilities
const PHILIPPINES_TIMEZONE = 'Asia/Manila';

// Utility functions for Philippines timezone handling
const createPhilippinesDate = (year: number, month: number, day: number = 1, hour: number = 0, minute: number = 0): Date => {
  // Create date in Philippines timezone
  const date = new Date();
  date.setFullYear(year, month, day);
  date.setHours(hour, minute, 0, 0);

  // Adjust for Philippines timezone (UTC+8)
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const philippinesTime = new Date(utcTime + (8 * 3600000));

  return philippinesTime;
};

const formatDateForPhilippines = (date: Date): string => {
  return date.toLocaleDateString('en-PH', {
    timeZone: PHILIPPINES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getPhilippinesDateString = (date: Date): string => {
  // Return YYYY-MM-DD format in Philippines timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Modern Material Design 3 Toggle Switch
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  icon
}) => {
  return (
    <div className={styles.toggleSwitch} onClick={() => onCheckedChange(!checked)}>
      <div className={styles.toggleIcon}>
        {icon}
      </div>
      <div className={styles.toggleContent}>
        <div className={styles.toggleHeader}>
          <div>
            <label htmlFor={id} className={styles.toggleLabel}>
              {label}
            </label>
            {description && (
              <p className={styles.toggleDescription}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${checked ? styles.checked : ''}`}
            role="switch"
            aria-checked={checked}
            onClick={(e) => {
              e.stopPropagation();
              onCheckedChange(!checked);
            }}
          >
            <span className={`${styles.toggleSlider} ${checked ? styles.checked : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricContent}>
        <div className={styles.metricInfo}>
          <p className={styles.metricTitle}>{title}</p>
          <p className={styles.metricValue}>{value}</p>
        </div>
        <div className={`${styles.metricIconContainer} ${styles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// New interfaces for monthly report system
interface ReportItem {
  id: string;
  type: 'Announcement' | 'Calendar';
  title: string;
  content: string;
  date: string;
  category: 'regular' | 'alert';
  images: string[];
  posted_by?: number;
  created_by?: number;
  posted_by_name?: string;
  created_by_name?: string;
  posted_by_department?: string;
  created_by_department?: string;
  posted_by_position?: string;
  created_by_position?: string;
  announcement_id?: number;
  calendar_id?: number;
  created_at?: string;
  event_date?: string;
  end_date?: string;
  visibility_end_at?: string;
  status?: string; // For announcements: draft, pending, published, archived
  is_active?: number; // For calendar events: 0 or 1
}

interface ReportTallies {
  announcements: {
    regular: number;
    alert: number;
    total: number;
  };
  school_calendar: {
    regular: number;
    alert: number;
    total: number;
  };
}

interface MonthlyReportData {
  report: {
    title: string;
    description: string;
    tallies: ReportTallies;
    items: ReportItem[];
    meta: {
      generatedAt: string;
      generatedBy: string;
    };
  };
}

// Enhanced interfaces for report types
type ReportType = 'monthly' | 'weekly' | 'daily' | 'custom';

// Date range presets
interface DateRangePreset {
  id: string;
  label: string;
  description: string;
  getValue: () => { startDate: Date; endDate: Date };
}

interface ReportRequest {
  month?: string; // YYYY-MM format (for monthly reports)
  fields: string[]; // ["Announcements", "SchoolCalendar"]
  includeImages?: boolean; // Whether to include actual images in PDF
  // For daily/custom reports
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  // For weekly reports
  weekStart?: string; // YYYY-MM-DD format
  weekEnd?: string; // YYYY-MM-DD format
}

// Date range presets for common selections
const getDateRangePresets = (): DateRangePreset[] => {
  const now = new Date();
  const today = createPhilippinesDate(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: 'today',
      label: 'Today',
      description: 'Current day',
      getValue: () => ({
        startDate: new Date(today),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      })
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      description: 'Previous day',
      getValue: () => {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday,
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      }
    },
    {
      id: 'last7days',
      label: 'Last 7 Days',
      description: 'Past week including today',
      getValue: () => ({
        startDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      })
    },
    {
      id: 'last30days',
      label: 'Last 30 Days',
      description: 'Past month including today',
      getValue: () => ({
        startDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      })
    },
    {
      id: 'thisMonth',
      label: 'This Month',
      description: 'Current month from 1st to today',
      getValue: () => ({
        startDate: createPhilippinesDate(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      })
    },
    {
      id: 'lastMonth',
      label: 'Last Month',
      description: 'Previous complete month',
      getValue: () => {
        const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
        const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const startDate = createPhilippinesDate(year, lastMonth, 1);
        const endDate = createPhilippinesDate(year, lastMonth + 1, 0, 23, 59);
        return { startDate, endDate };
      }
    }
  ];
};

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [includeImages, setIncludeImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified state management
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Get available presets
  const dateRangePresets = getDateRangePresets();

  // Test connectivity on component mount
  React.useEffect(() => {
    const testConnectivity = async () => {
      try {
        console.log('🔍 Testing backend connectivity...');
        const response = await adminHttpClient.get('/health');
        console.log('✅ Backend connectivity test passed:', response.data);
      } catch (err: any) {
        console.warn('⚠️ Backend connectivity test failed:', err.message);
        console.warn('⚠️ This might indicate a CORS or network issue');
      }
    };

    testConnectivity();
  }, []);

  // Helper function to load image as base64
  const loadImageAsBase64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx?.drawImage(img, 0, 0);

        // Get base64 data
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${imagePath}`);
        reject(new Error(`Failed to load image: ${imagePath}`));
      };

      // Construct full image URL
      const baseUrl = API_BASE_URL;
      const fullImageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}/${imagePath}`;
      img.src = fullImageUrl;
    });
  };

  // Field options with modern icons
  const fieldOptions = [
    {
      id: 'Announcements',
      label: 'Announcements',
      description: 'Include all announcement posts',
      icon: <FileText className="w-5 h-5 text-blue-600" />
    },
    {
      id: 'SchoolCalendar',
      label: 'School Calendar',
      description: 'Include calendar events',
      icon: <Calendar className="w-5 h-5 text-green-600" />
    }
  ];

  const handleFieldChange = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldId]);
    } else {
      setSelectedFields(prev => prev.filter(id => id !== fieldId));
    }
  };

  // Helper function to calculate date range based on report type
  const calculateDateRange = (): { startDate: Date; endDate: Date } => {
    switch (reportType) {
      case 'monthly':
        if (!selectedMonth) {
          throw new Error('Please select a month for monthly report');
        }
        const [year, monthNum] = selectedMonth.split('-').map(Number);
        const startDate = createPhilippinesDate(year, monthNum - 1, 1);
        const endDate = createPhilippinesDate(year, monthNum, 0, 23, 59);
        return { startDate, endDate };

      case 'weekly':
        // For weekly reports, calculate the week containing the start date
        if (!dateRange.startDate) {
          throw new Error('Please select a date for weekly report');
        }
        const selectedDate = dateRange.startDate;
        const dayOfWeek = selectedDate.getDay();
        const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(selectedDate);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { startDate: monday, endDate: sunday };

      case 'daily':
        if (!dateRange.startDate) {
          throw new Error('Please select a date for daily report');
        }
        const dayStart = new Date(dateRange.startDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateRange.startDate);
        dayEnd.setHours(23, 59, 59, 999);
        return { startDate: dayStart, endDate: dayEnd };

      case 'custom':
        if (!dateRange.startDate || !dateRange.endDate) {
          throw new Error('Please select both start and end dates for custom report');
        }
        const customStart = new Date(dateRange.startDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(dateRange.endDate);
        customEnd.setHours(23, 59, 59, 999);
        return { startDate: customStart, endDate: customEnd };

      default:
        throw new Error('Invalid report type');
    }
  };

  // Helper function to format date range for display
  const getDateRangeLabel = (): string => {
    try {
      const { startDate, endDate } = calculateDateRange();
      const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: PHILIPPINES_TIMEZONE
      };

      switch (reportType) {
        case 'monthly':
          return startDate.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            timeZone: PHILIPPINES_TIMEZONE
          });
        case 'weekly':
          return `Week: ${startDate.toLocaleDateString('en-PH', formatOptions)} - ${endDate.toLocaleDateString('en-PH', formatOptions)}`;
        case 'daily':
          return `Day: ${startDate.toLocaleDateString('en-PH', formatOptions)}`;
        case 'custom':
          if (startDate.toDateString() === endDate.toDateString()) {
            return `Day: ${startDate.toLocaleDateString('en-PH', formatOptions)}`;
          }
          return `Custom: ${startDate.toLocaleDateString('en-PH', formatOptions)} - ${endDate.toLocaleDateString('en-PH', formatOptions)}`;
        default:
          return 'Invalid date range';
      }
    } catch (error) {
      return 'Please complete your selection';
    }
  };

  // Helper function to handle preset selection
  const handlePresetSelection = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = dateRangePresets.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getValue();
      setDateRange({
        startDate: range.startDate,
        endDate: range.endDate
      });
      setReportType('custom');
    }
  };

  // Helper function to reset selections when report type changes
  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    setSelectedPreset('');
    setDateRange({ startDate: null, endDate: null });
    setSelectedMonth('');
    setError(null);
  };

  const generateReport = async () => {
    // Enhanced validation
    if (selectedFields.length === 0) {
      setError('Please select at least one content type (Announcements or School Calendar) to generate the report.');
      return;
    }

    // Validate based on report type
    try {
      const { startDate, endDate } = calculateDateRange();

      // Additional validation for date ranges
      if (startDate > endDate) {
        setError('Start date cannot be after end date.');
        return;
      }

      // Check if date range is too large (more than 1 year)
      const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDifference > 365) {
        setError('Date range cannot exceed 365 days. Please select a shorter period.');
        return;
      }

      // Check if dates are in the future
      const now = new Date();
      if (startDate > now) {
        setError('Start date cannot be in the future.');
        return;
      }

    } catch (error: any) {
      setError(error.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = calculateDateRange();
      let requestBody: ReportRequest;

      switch (reportType) {
        case 'monthly':
          requestBody = {
            month: selectedMonth,
            fields: selectedFields,
            includeImages: includeImages
          };
          break;
        case 'weekly':
          requestBody = {
            weekStart: getPhilippinesDateString(startDate),
            weekEnd: getPhilippinesDateString(endDate),
            fields: selectedFields,
            includeImages: includeImages
          };
          break;
        case 'daily':
          requestBody = {
            startDate: getPhilippinesDateString(startDate),
            endDate: getPhilippinesDateString(endDate),
            fields: selectedFields,
            includeImages: includeImages
          };
          break;
        case 'custom':
          requestBody = {
            startDate: getPhilippinesDateString(startDate),
            endDate: getPhilippinesDateString(endDate),
            fields: selectedFields,
            includeImages: includeImages
          };
          break;
        default:
          throw new Error('Invalid report type');
      }

      console.log('📤 Sending report request:', requestBody);
      console.log('📤 Using API base URL:', API_BASE_URL);

      // Send request to the flexible report generation endpoint
      const response = await adminHttpClient.post<MonthlyReportData>('/api/reports/generate', requestBody);
      console.log('📥 API Response:', response);
      console.log('📥 Response Success:', response.success);
      console.log('📥 Response Message:', response.message);
      console.log('📥 Response Data:', response.data);

      // Check if response exists and has the expected structure
      if (!response) {
        console.error('❌ No response received');
        throw new Error('No response received from server');
      }

      if (!response.success) {
        console.error('❌ Server returned error:', response.message);
        throw new Error(response.message || 'Server returned an error');
      }

      if (!response.data) {
        console.error('❌ No report data in response:', response);
        throw new Error('No report data received from server');
      }

      // Validate the report data structure
      const reportData = response.data;
      if (!reportData || !reportData.report || !reportData.report.tallies || !reportData.report.items) {
        console.error('❌ Invalid report data structure:', reportData);
        throw new Error('Invalid report data structure received from server');
      }

      console.log('📊 Report Data:', reportData);
      console.log('📊 Tallies:', reportData.report.tallies);
      console.log('📊 Items count:', reportData.report.items.length);
      
      // Debug: Log first announcement and calendar event
      const firstAnnouncement = reportData.report.items.find(item => item.type === 'Announcement');
      const firstCalendar = reportData.report.items.find(item => item.type === 'Calendar');
      
      if (firstAnnouncement) {
        console.log('📊 [FRONTEND DEBUG] First Announcement - ALL FIELDS:', firstAnnouncement);
        console.log('📊 [FRONTEND DEBUG] First Announcement - Specific:', {
          title: firstAnnouncement.title,
          status: firstAnnouncement.status,
          visibility_end_at: firstAnnouncement.visibility_end_at,
          is_active: firstAnnouncement.is_active,
          all_keys: Object.keys(firstAnnouncement)
        });
      }
      
      if (firstCalendar) {
        console.log('📊 [FRONTEND DEBUG] First Calendar Event - ALL FIELDS:', firstCalendar);
        console.log('📊 [FRONTEND DEBUG] First Calendar Event - Specific:', {
          title: firstCalendar.title,
          status: firstCalendar.status,
          is_active: firstCalendar.is_active,
          end_date: firstCalendar.end_date,
          event_date: firstCalendar.event_date,
          all_keys: Object.keys(firstCalendar)
        });
      }

      setReportData(reportData);
    } catch (err: any) {
      console.error('Error generating report:', err);

      // Handle custom HttpClient errors
      if (err.status !== undefined) {
        // This is an ApiError from the custom HttpClient
        setError(`Server error (${err.status}): ${err.message}`);
      } else if (err.message) {
        // This is a regular error
        setError(err.message);
      } else {
        // Fallback error message
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF();
      // Generate filename based on report type
      const generateFilename = (): string => {
        const timestamp = new Date().toISOString().split('T')[0];
        switch (reportType) {
          case 'monthly':
            return `monthly-report-${selectedMonth.replace('-', '')}-${timestamp}`;
          case 'weekly':
          case 'daily':
          case 'custom':
            const { startDate, endDate } = calculateDateRange();
            const start = getPhilippinesDateString(startDate);
            const end = getPhilippinesDateString(endDate);
            const typePrefix = reportType === 'custom' ? 'custom' : reportType;
            return `${typePrefix}-report-${start}-to-${end}-${timestamp}`;
          default:
            return `report-${timestamp}`;
        }
      };
      const filename = generateFilename();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('VCBA E-Bulletin Board', 105, 20, { align: 'center' });

      // Dynamic report title based on report type
      const getReportTitle = (): string => {
        switch (reportType) {
          case 'monthly': return 'Monthly Report';
          case 'weekly': return 'Weekly Report';
          case 'daily': return 'Daily Report';
          case 'custom': return 'Custom Report';
          default: return 'Report';
        }
      };

      doc.setFontSize(16);
      doc.text(getReportTitle(), 105, 30, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${getDateRangeLabel()}`, 105, 40, { align: 'center' });
      doc.text(`Generated: ${formatDateForPhilippines(new Date())} (Philippines Time)`, 105, 50, { align: 'center' });

      let yPosition = 70;

      // Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Content Type', 'Regular', 'Alert', 'Total'],
        ['Announcements',
         reportData.report.tallies.announcements.regular.toString(),
         reportData.report.tallies.announcements.alert.toString(),
         reportData.report.tallies.announcements.total.toString()],
        ['School Calendar',
         reportData.report.tallies.school_calendar.regular.toString(),
         reportData.report.tallies.school_calendar.alert.toString(),
         reportData.report.tallies.school_calendar.total.toString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Detailed Content Sections
      if (reportData.report.items.length > 0) {
        // Separate announcements and calendar events
        const announcements = reportData.report.items.filter(item => item.type === 'Announcement');
        const calendarEvents = reportData.report.items.filter(item => item.type === 'Calendar');

        // Announcements Section
        if (announcements.length > 0) {
          // Check if we need a new page
          if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Announcements Details', 20, yPosition);
          yPosition += 15;

          const announcementTableData = announcements.map(item => {
            // Format status: draft, pending, published, archived
            let statusDisplay = 'Unknown';
            if (item.status) {
              statusDisplay = item.status.charAt(0).toUpperCase() + item.status.slice(1);
            }

            return [
              item.title,
              item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
              item.posted_by_name || `Admin ID: ${item.posted_by || 'N/A'}`,
              new Date(item.date).toLocaleDateString(),
              item.visibility_end_at ? new Date(item.visibility_end_at).toLocaleDateString() : 'No End Date',
              statusDisplay,
              item.category.toUpperCase(),
              item.images.length > 0 ? `${item.images.length} image(s)` : 'No images'
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Title', 'Content', 'Posted By', 'Date Created', 'End Date', 'Status', 'Type', 'Attachments']],
            body: announcementTableData,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 30 }, // Title
              1: { cellWidth: 40 }, // Content
              2: { cellWidth: 22 }, // Posted By
              3: { cellWidth: 20 }, // Date Created
              4: { cellWidth: 20 }, // End Date
              5: { cellWidth: 18 }, // Status
              6: { cellWidth: 18 }, // Type
              7: { cellWidth: 22 }  // Attachments
            }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // School Calendar Section
        if (calendarEvents.length > 0) {
          // Check if we need a new page
          if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('School Calendar Events Details', 20, yPosition);
          yPosition += 15;

          const calendarTableData = calendarEvents.map(item => {
            // Format status based on is_active: 0 = Inactive, 1 = Active
            let statusDisplay = 'Unknown';
            if (item.is_active !== undefined && item.is_active !== null) {
              statusDisplay = item.is_active === 1 ? 'Active' : 'Inactive';
            }

            return [
              item.title,
              item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
              item.created_by_name || `Admin ID: ${item.created_by || 'N/A'}`,
              item.event_date ? new Date(item.event_date).toLocaleDateString() : new Date(item.date).toLocaleDateString(),
              item.end_date ? new Date(item.end_date).toLocaleDateString() : 'No End Date',
              statusDisplay,
              item.category.toUpperCase(),
              item.images.length > 0 ? `${item.images.length} image(s)` : 'No images'
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Title', 'Description', 'Created By', 'Event Date', 'End Date', 'Status', 'Type', 'Attachments']],
            body: calendarTableData,
            theme: 'striped',
            headStyles: { fillColor: [46, 125, 50], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 30 }, // Title
              1: { cellWidth: 40 }, // Description
              2: { cellWidth: 22 }, // Created By
              3: { cellWidth: 20 }, // Event Date
              4: { cellWidth: 20 }, // End Date
              5: { cellWidth: 18 }, // Status
              6: { cellWidth: 18 }, // Type
              7: { cellWidth: 22 }  // Attachments
            }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Add images if enabled
        if (includeImages) {
          await addImagesToPDF(doc, reportData.report.items, yPosition);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('CONFIDENTIAL - For Internal Use Only', 105, 285, { align: 'center' });
      }

      doc.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again.');
    }
  };

  // Helper function to add images to PDF
  const addImagesToPDF = async (doc: jsPDF, items: ReportItem[], startY: number) => {
    let yPosition = startY + 20;

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Attached Images', 20, yPosition);
    yPosition += 20;

    for (const item of items) {
      if (item.images && item.images.length > 0) {
        // Check if we need a new page for this item
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        // Item header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.type}: ${item.title}`, 20, yPosition);
        yPosition += 15;

        // Load and add ALL images for this item
        for (let i = 0; i < item.images.length; i++) {
          try {
            const imagePath = item.images[i];
            const imageData = await loadImageAsBase64(imagePath);

            // Calculate image dimensions (max width: 140, max height: 100)
            const maxWidth = 140;
            const maxHeight = 100;

            // Check if we need a new page before adding the image
            if (yPosition + maxHeight > 240) {
              doc.addPage();
              yPosition = 20;
            }

            // Add image to PDF
            doc.addImage(imageData, 'JPEG', 20, yPosition, maxWidth, maxHeight);
            yPosition += maxHeight + 10;

          } catch (error) {
            console.warn(`Failed to load image for ${item.title}:`, error);
            // Add placeholder text for failed images
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');

            // Check if we need a new page for the error text
            if (yPosition + 15 > 270) {
              doc.addPage();
              yPosition = 20;
            }

            doc.text(`[Image could not be loaded: ${item.images[i]}]`, 20, yPosition);
            yPosition += 15;
          }
        }

        yPosition += 10; // Space between items
      }
    }
  };

  const isGenerateEnabled = (): boolean => {
    if (selectedFields.length === 0) return false;

    switch (reportType) {
      case 'monthly':
        return !!selectedMonth;
      case 'weekly':
      case 'daily':
        return !!dateRange.startDate;
      case 'custom':
        return !!(dateRange.startDate && dateRange.endDate);
      default:
        return false;
    }
  };

  return (
    <div className={styles.reportsContainer}>
      {/* Modern Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {reportData && (
            <Button
              onClick={exportToPDF}
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export PDF
            </Button>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.gridLayout}>

          {/* Configuration Panel */}
          <div className={styles.configPanel}>
            <div className={styles.configHeader}>
              <div className={styles.configHeaderContent}>
                <Settings />
                <h2 className={styles.configTitle}>Configuration</h2>
              </div>
            </div>
            <div className={styles.configContent}>
              {/* Report Type Selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <CalendarRange />
                  <span>Report Type</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {(['monthly', 'weekly', 'daily', 'custom'] as ReportType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleReportTypeChange(type)}
                      className={`${styles.periodButton} ${reportType === type ? styles.active : ''}`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)} Reports
                    </button>
                  ))}
                </div>

                {/* Report Type Descriptions */}
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '1rem'
                }}>
                  {reportType === 'monthly' && (
                    <p style={{ margin: 0 }}>
                      <strong>Monthly Reports:</strong> Generate a complete report for an entire month. Select any month to get all announcements and calendar events from that month.
                    </p>
                  )}
                  {reportType === 'weekly' && (
                    <p style={{ margin: 0 }}>
                      <strong>Weekly Reports:</strong> Generate a report for a specific week. Select any date to automatically choose the week containing that date (Monday to Sunday).
                    </p>
                  )}
                  {reportType === 'daily' && (
                    <p style={{ margin: 0 }}>
                      <strong>Daily Reports:</strong> Generate a report for a specific day. Select any date to get all content from that single day.
                    </p>
                  )}
                  {reportType === 'custom' && (
                    <p style={{ margin: 0 }}>
                      <strong>Custom Reports:</strong> Generate a report for any date range. Use presets for common ranges or select custom start and end dates.
                    </p>
                  )}
                </div>

                {/* Quick Presets for Custom Reports */}
                {reportType === 'custom' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <Zap />
                      <span>Quick Presets</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                      {dateRangePresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handlePresetSelection(preset.id)}
                          className={`${styles.modeButton} ${selectedPreset === preset.id ? styles.active : ''}`}
                          title={preset.description}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Month Selection (Required for Monthly reports only) */}
              {reportType === 'monthly' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <Calendar />
                    <span>Select Month for Report</span>
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    max={`${new Date().getFullYear()}-${String(
                      new Date().getMonth() + 1
                    ).padStart(2, '0')}`}
                    className={styles.monthInput}
                  />
                </div>
              )}

              {/* Date Selection for Weekly and Daily reports */}
              {(reportType === 'weekly' || reportType === 'daily') && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <CalendarDays />
                    <span>
                      {reportType === 'weekly' ? 'Select Any Date in Desired Week' : 'Select Date'}
                    </span>
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: reportType === 'weekly' ? '#f0fdf4' : '#eff6ff',
                    border: `1px solid ${reportType === 'weekly' ? '#bbf7d0' : '#bfdbfe'}`,
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: reportType === 'weekly' ? '#15803d' : '#1e40af',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0 }}>
                      {reportType === 'weekly'
                        ? '📅 Select any date to automatically choose the week containing that date (Monday to Sunday).'
                        : '📅 Select the specific date for your daily report.'
                      }
                    </p>
                  </div>
                  <DatePicker
                    selected={dateRange.startDate}
                    onChange={(date) => setDateRange({ startDate: date, endDate: date })}
                    className={styles.datePickerInput}
                    placeholderText={`Click to select ${reportType === 'weekly' ? 'any date in the desired week' : 'date'}`}
                    dateFormat="MMM d, yyyy"
                    showPopperArrow={false}
                    maxDate={new Date()} // Don't allow future dates
                  />

                  {/* Show calculated date range for weekly reports */}
                  {dateRange.startDate && reportType === 'weekly' && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#15803d'
                    }}>
                      <strong>📅 Week Range:</strong> {getDateRangeLabel()}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Date Range Selection */}
              {reportType === 'custom' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <CalendarRange />
                    <span>Custom Date Range</span>
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ margin: 0 }}>
                      📅 Select start and end dates for your custom report. You can select dates across different months and years.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        Start Date:
                      </label>
                      <DatePicker
                        selected={dateRange.startDate}
                        onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                        selectsStart
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        maxDate={dateRange.endDate || new Date()}
                        className={styles.datePickerInput}
                        placeholderText="Click to select start date"
                        dateFormat="MMM d, yyyy"
                        showPopperArrow={false}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        End Date:
                      </label>
                      <DatePicker
                        selected={dateRange.endDate}
                        onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                        selectsEnd
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        minDate={dateRange.startDate || undefined}
                        maxDate={new Date()}
                        className={styles.datePickerInput}
                        placeholderText="Click to select end date"
                        dateFormat="MMM d, yyyy"
                        showPopperArrow={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date Range Preview */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fefce8',
                border: '1px solid #fde047',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#a16207'
              }}>
                <strong>📊 Report Range:</strong> {getDateRangeLabel()}
              </div>

              {/* Content Types */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Filter />
                  <span>Content Types</span>
                </label>
                <div className={styles.toggleContainer}>
                  {fieldOptions.map((field) => (
                    <ToggleSwitch
                      key={field.id}
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                      label={field.label}
                      description={field.description}
                      icon={field.icon}
                    />
                  ))}
                </div>
              </div>

              {/* PDF Options */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Image />
                  <span>Export Options</span>
                </label>
                <ToggleSwitch
                  id="includeImages"
                  checked={includeImages}
                  onCheckedChange={setIncludeImages}
                  label="Include Images"
                  description="Embed actual images in PDF export"
                  icon={<Eye className="w-4 h-4" style={{ color: '#8b5cf6' }} />}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateReport}
                disabled={!isGenerateEnabled() || loading}
                className={styles.generateButton}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className={styles.resultsPanel}>
            {/* Loading State */}
            {loading && (
              <div className={styles.loadingCard}>
                <div className={styles.loadingContent}>
                  <div className={styles.loadingSpinner}>
                    <div className={styles.spinnerRing}></div>
                    <div className={styles.spinnerRing}></div>
                  </div>
                  <div className={styles.loadingText}>
                    <h3 className={styles.loadingTitle}>Generating Report</h3>
                    <p className={styles.loadingSubtitle}>Analyzing your content data...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={styles.errorCard}>
                <div className={styles.errorContent}>
                  <div className={styles.errorIcon}>
                    <AlertTriangle />
                  </div>
                  <div className={styles.errorText}>
                    <h3 className={styles.errorTitle}>Report Generation Failed</h3>
                    <p className={styles.errorMessage}>{error}</p>
                    <div className={styles.errorActions}>
                      <Button
                        onClick={generateReport}
                        size="sm"
                        variant="outline"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={() => setError(null)}
                        size="sm"
                        variant="outline"
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Metrics */}
            {reportData && (
              <div className={styles.resultsPanel}>
                {/* Metrics Grid */}
                <div className={styles.metricsGrid}>
                  <MetricCard
                    title="Total Announcements"
                    value={reportData.report.tallies.announcements.total}
                    icon={<FileText />}
                    color="blue"
                  />
                  <MetricCard
                    title="Alert Announcements"
                    value={reportData.report.tallies.announcements.alert}
                    icon={<AlertTriangle />}
                    color="orange"
                  />
                  <MetricCard
                    title="Total Calendar Events"
                    value={reportData.report.tallies.school_calendar.total}
                    icon={<Calendar />}
                    color="green"
                  />
                  <MetricCard
                    title="Alert Events"
                    value={reportData.report.tallies.school_calendar.alert}
                    icon={<Activity />}
                    color="purple"
                  />
                </div>

                {/* Content Items */}
                {reportData.report.items.length > 0 && (
                  <div className={styles.contentCard}>
                    <div className={styles.contentHeader}>
                      <div className={styles.contentHeaderContent}>
                        <h3 className={styles.contentTitle}>
                          Content Items ({reportData.report.items.length})
                        </h3>
                        <div className={styles.contentMeta}>
                          <Clock />
                          <span>{new Date(reportData.report.meta.generatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.contentList}>
                      {reportData.report.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`${styles.contentItem} ${
                            index === reportData.report.items.length - 1 ? '' : ''
                          }`}
                        >
                          <div className={styles.contentItemContent}>
                            <div className={styles.contentItemMain}>
                              <div className={styles.contentItemHeader}>
                                {item.type === 'Announcement' ? (
                                  <FileText style={{ color: 'var(--color-info)' }} />
                                ) : (
                                  <Calendar style={{ color: 'var(--color-success)' }} />
                                )}
                                <h4 className={styles.contentItemTitle}>{item.title}</h4>
                              </div>
                              <p className={styles.contentItemDescription}>{item.content}</p>
                              <div className={styles.contentItemMeta}>
                                <span>{new Date(item.date).toLocaleDateString()}</span>
                                {item.type === 'Announcement' && item.posted_by_name && (
                                  <span>By: {item.posted_by_name}</span>
                                )}
                                {item.type === 'Calendar' && item.created_by_name && (
                                  <span>By: {item.created_by_name}</span>
                                )}
                                {item.images.length > 0 && (
                                  <div className={styles.contentItemImages}>
                                    <Image />
                                    <span>{item.images.length}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={styles.contentItemBadge}>
                              <span className={`${styles.badge} ${item.category === 'alert' ? styles.alert : styles.regular}`}>
                                {item.category === 'alert' ? 'Alert' : 'Regular'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && !reportData && (
              <div className={styles.emptyCard}>
                <div className={styles.emptyContent}>
                  <BarChart3 className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>Ready to Generate Report</h3>
                  <p className={styles.emptyDescription}>
                    Choose your report type, select the time period, and pick content types to generate your analytics report.
                  </p>
                  <div className={styles.emptyFeatures}>
                    <div className={styles.emptyFeature}>
                      <CheckCircle />
                      <span>Comprehensive Analytics</span>
                    </div>
                    <div className={styles.emptyFeature}>
                      <Download />
                      <span>PDF Export</span>
                    </div>
                    <div className={styles.emptyFeature}>
                      <Image />
                      <span>Image Support</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;