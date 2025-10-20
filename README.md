# RDV App

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-Enhanced-green.svg)](https://github.com/kvaksin/rdvapp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

A **secure, comprehensive class-based appointment booking application** with advanced user management, role-based authentication, and robust approval workflows. Built with modern web technologies including Vite, React, TypeScript, and Tailwind CSS.

## 🚨 **Recent Enhancements**

### ✅ **Comprehensive Communication System (v2.6.0)**
**New Feature**: Enterprise-grade communication platform enabling seamless messaging between administrators, class leads, and parents with automatic data retention and smart notifications.

**Communication Features**:
- ✅ **Admin to Class Broadcasting**: Administrators can send messages to entire classes with checkbox selection for multiple classes
- ✅ **Class Lead to Parent Messaging**: Class leads can message parents by selecting specific children or entire classes they manage
- ✅ **Parent to Class Lead Communication**: Parents can send messages directly to class leads for their enrolled classes
- ✅ **Role-Based Message Targeting**: Smart recipient selection based on user roles and class assignments
- ✅ **Interactive Message Composition**: Modal-based composer with message type selection and recipient filtering
- ✅ **Message Thread Display**: Chronological message display with sender identification and timestamps
- ✅ **Real-Time Status Tracking**: Unread message indicators with automatic read status updates
- ✅ **Automatic Data Retention**: Messages automatically deleted after 2 weeks with daily cleanup scheduling
- ✅ **Integrated Notifications**: New messages trigger notification system with preview and sender details

**User Interface Enhancements**:
- ✅ **Communication Navigation**: New "Communication" page accessible to all authenticated users
- ✅ **Message Type Selection**: Dynamic interface adapting to user role (admin/class_lead/parent options)
- ✅ **Recipient Selection Modes**: Toggle between class-based and child-based targeting for flexible messaging
- ✅ **Visual Message Threading**: Color-coded message types with emoji indicators and sender roles
- ✅ **Subject Line Support**: Optional subject fields for better message organization
- ✅ **Multi-Language Support**: Complete translation coverage for EN/FR/NL languages

**Backend Architecture**:
- ✅ **REST API Endpoints**: Complete messaging API with 6 dedicated endpoints for role-based communication
- ✅ **Message Persistence**: Dedicated messages.json storage with structured data model
- ✅ **Permission Validation**: Server-side role checking ensures users can only send/receive appropriate messages
- ✅ **Automatic Cleanup System**: Daily scheduled cleanup removes messages older than 2 weeks
- ✅ **Notification Integration**: Messages automatically trigger notification system with rich metadata

**Security & Compliance**:
- ✅ **Role-Based Access Control**: Messages filtered by user permissions and class assignments
- ✅ **Data Privacy**: Automatic message deletion ensures compliance with data retention policies
- ✅ **Input Validation**: Server-side validation of all message content and recipient selections
- ✅ **Audit Trail**: All message activities logged for accountability and security monitoring

**Benefits**:
- **Streamlined Communication**: Eliminates need for external communication tools between school staff and parents
- **Professional Messaging**: Structured communication with proper role identification and threading
- **Automatic Organization**: Messages organized by type, date, and read status for easy management
- **Privacy Compliance**: Automatic data retention ensures messages don't accumulate indefinitely
- **Enhanced Workflow**: Integrated notifications direct users to relevant communication requiring attention
- **Multi-Role Support**: Single interface supporting all communication patterns (admin↔class, class_lead↔parents, parent↔class_lead)

### ✅ **File Attachment System (v2.7.0)**
**New Feature**: Complete file attachment functionality for the messaging system with secure upload, validation, and download capabilities.

**File Upload Features**:
- ✅ **File Selection Interface**: Drag-and-drop or click-to-select file upload with visual preview
- ✅ **Multiple File Support**: Attach up to 5 files per message with individual 5MB size limit
- ✅ **File Type Validation**: Supports documents (PDF, DOC, DOCX), images (JPG, PNG, GIF), and text files
- ✅ **Real-Time File Preview**: Shows selected files with name, size, and type before sending
- ✅ **Upload Progress**: Visual feedback during file upload process with error handling
- ✅ **File Size Limits**: 5MB maximum per file with clear error messages for oversized files

**Message Integration**:
- ✅ **Attachment Display**: Attached files shown in message threads with download links
- ✅ **File Information**: Displays original filename, file size, and upload timestamp
- ✅ **Secure Downloads**: Protected download endpoints requiring proper authentication
- ✅ **Message Enhancement**: Attachments seamlessly integrated into all message types (admin-to-class, class-lead-to-parents, parent-to-class-lead)

**Security & Storage**:
- ✅ **Secure File Storage**: Files stored in protected server directory with unique identifiers
- ✅ **Access Control**: Only message recipients can download attached files
- ✅ **File Validation**: Server-side validation of file types, sizes, and content
- ✅ **Malware Protection**: File type restrictions prevent execution of dangerous file types
- ✅ **Organized Storage**: Files organized by upload date with automatic directory creation

**Backend Architecture**:
- ✅ **Multer Integration**: Professional file upload handling with configurable limits
- ✅ **RESTful Upload API**: Dedicated endpoints for file upload and serving
- ✅ **Database Integration**: Attachment metadata stored with message data
- ✅ **Error Handling**: Comprehensive error handling for all file operations
- ✅ **Clean Architecture**: Modular file handling system with separation of concerns

**User Experience**:
- ✅ **Intuitive Interface**: Simple file selection with clear visual feedback
- ✅ **Progress Indicators**: Upload status and completion notifications
- ✅ **Error Recovery**: Clear error messages with guidance for resolution
- ✅ **Mobile Support**: Touch-friendly file selection for mobile devices
- ✅ **Accessibility**: Screen reader compatible with proper ARIA labels

**Benefits**:
- **Enhanced Communication**: Share important documents, images, and files directly in messages
- **Secure Sharing**: Protected file access ensures only intended recipients can download attachments
- **Professional Workflow**: Eliminates need for external file sharing services
- **Data Integrity**: Robust validation ensures file safety and system stability
- **User-Friendly**: Intuitive interface makes file sharing accessible to all users
- **Compliance Ready**: Secure file handling meets data protection requirements

### ✅ **Enhanced Child Selection & Booking Policy (v2.5.0)**
**New Features**: Advanced child selection system with modal interface, comprehensive booking restrictions, and enhanced user identification for streamlined registration and professional presentation.

**Child Selection Enhancements**:
- ✅ **Smart Child Selection Modal**: Interactive popup with existing children display and creation options
- ✅ **Existing Child Integration**: Shows all available children per class with selection checkboxes
- ✅ **Create New Children**: Inline child creation with instant feedback
- ✅ **Mixed Selection Support**: Combine existing child selection with new child creation
- ✅ **Visual Selection Preview**: Clear display of selected children with existing/new indicators
- ✅ **Multi-Language Support**: Full translation support for all child selection interfaces

**Booking Policy Enhancements**:
- ✅ **One Booking Per Child**: Each child can only have one active appointment at a time
- ✅ **Multi-Parent Protection**: Prevents multiple parents of the same child from creating duplicate bookings
- ✅ **Clear Error Messages**: Informative feedback when booking restrictions apply
- ✅ **Existing Booking Details**: Shows information about current booking when restriction is triggered

**Registration Enhancements**:
- ✅ **Required Name Fields**: First Name and Last Name are now mandatory during registration
- ✅ **Enhanced User Display**: User approval interface shows "FirstName LastName" with email below
- ✅ **Professional Notifications**: System notifications include full names for better identification
- ✅ **Avatar Improvements**: User avatars use first letter of first name instead of email
- ✅ **Backward Compatibility**: Gracefully handles existing users without name data

**Benefits**:
- **Booking Integrity**: Prevents scheduling conflicts and duplicate appointments per child
- **Fair Access**: Ensures equal opportunity for all families to book appointments
- **Professional Presentation**: Clear identification with proper names instead of email-only
- **Improved User Experience**: More intuitive user recognition in admin interfaces
- **Enhanced Notifications**: Administrators receive notifications with meaningful user identification
- **Better Organization**: Approval workflows display users in a more professional manner

### ✅ **Automatic Notification Cleanup (v2.3.0)**
**New Feature**: Intelligent notification management system with automatic cleanup to maintain optimal performance and storage efficiency.

**Cleanup Features**:
- ✅ **30-Day Retention Policy**: Notifications older than 30 days are automatically removed
- ✅ **Daily Automated Cleanup**: Scheduled cleanup runs every day at 2:00 AM
- ✅ **Startup Maintenance**: Cleanup executes immediately when server starts
- ✅ **Manual Admin Control**: Administrators can trigger on-demand cleanup via API
- ✅ **Performance Optimization**: Prevents notification table growth, maintains query speed
- ✅ **Audit Logging**: All cleanup activities logged with statistics (removed/remaining counts)

**Benefits**:
- **Database Performance**: Maintains optimal notification table size for faster queries
- **Storage Management**: Prevents indefinite data accumulation
- **Zero Maintenance**: Fully automated with no administrator intervention required
- **Admin Oversight**: Manual cleanup option available when needed

### ✅ **Smart Notification Navigation (v2.2.0)**
**New Feature**: Enhanced notification system with intelligent click-to-action navigation for improved workflow efficiency.

**Navigation Improvements**:
- ✅ **Smart Click Navigation**: Clicking notifications automatically opens relevant pages for pending tasks
- ✅ **Action-Based Routing**: User approval requests → User Approval page, Class assignment requests → Admin page
- ✅ **Visual Task Indicators**: Clear distinction between actionable and informational notifications
- ✅ **Workflow Optimization**: Streamlined user experience from notification to task completion

### ✅ **Authentication Security Fix (v2.1.0)**
**Issue Resolved**: Fixed critical security vulnerability where users with pending or rejected status could access protected endpoints with valid JWT tokens.

**Security Improvements**:
- ✅ **Enhanced Token Validation**: `authenticateToken` middleware now verifies user approval status on every request
- ✅ **Status-Based Access Control**: Users must have `status: "approved"` to access any protected resources
- ✅ **Real-Time Authorization**: Token validation includes live user status checking
- ✅ **Graceful Error Messages**: Clear feedback for pending/rejected users with detailed status information

**Protected Endpoints**:
- `/api/slots` - Class schedules and time slots
- `/api/bookings` - Appointment bookings
- `/api/classes` - Class management
- All admin and user management functions

**Before Fix**: Pending/rejected users could access class schedules and book appointments  
**After Fix**: Only approved users can access any system functionality beyond login

**Security Testing**: ✅ Verified that pending users receive `403 Forbidden` errors when accessing protected resources

## 🛡️ **Security Architecture**

### **Multi-Layer Security Model**
1. **Authentication Layer**: JWT-based token authentication with secure password hashing
2. **Authorization Layer**: Role-based permissions (Administrator, Class Lead, Parent)
3. **Status Verification Layer**: Real-time user approval status validation
4. **Input Validation Layer**: Server-side validation of all user inputs
5. **Audit Layer**: Comprehensive logging of all security events

### **User Approval Workflow Security**
- **Pending State**: New registrations cannot access any protected resources
- **Approval Authority**: Strict role-based approval permissions prevent privilege escalation
- **Status Enforcement**: Token validation includes live user status checking on every request
- **Rejection Handling**: Rejected users receive clear feedback and cannot re-access system

### **Class Lead Security Restrictions**
- ✅ Can approve parent users only
- ❌ **Cannot approve other class leads** (prevents unauthorized privilege escalation)
- ❌ **Cannot approve administrators** (maintains admin authority hierarchy)
- 🔒 All approval violations logged and blocked with user notification

## ✨ Key Features

### 🔐 Advanced Authentication & User Management System

#### **Multi-Role Authentication Architecture**
- **JWT-based Security**: Secure token authentication with role-based access control
- **Three User Roles**: Administrator, Class Lead, and Parent with distinct permissions
- **Registration & Approval Workflow**: Multi-step user registration with mandatory approval process
- **Role-Based Route Protection**: Pages and features restricted based on user authorization levels

#### **User Registration & Approval System**
- **Self-Registration Portal**: Users can register with email, password, and role selection
- **Class Assignment During Registration**: Users select their target class during signup
- **Pending Status Management**: New registrations enter pending state until approved
- **Approval Authority Rules**:
  - **Administrators**: Can approve all user types (administrators, class leads, parents)
  - **Class Leads**: Can approve parents only (NOT other class leads or administrators)
  - **Parents**: Cannot approve any users
- **Email Notifications**: Automatic notifications for approval/rejection decisions
- **Audit Logging**: Complete tracking of all approval decisions and user actions

#### **Bulk User Management**
- **Multi-Select Interface**: Checkbox-based selection for bulk operations
- **Admin-Only Bulk Deletion**: Mass user removal with cascading data cleanup
- **Self-Deletion Prevention**: Administrators cannot delete their own accounts
- **Comprehensive Data Cleanup**: Automatically removes associated bookings, requests, and assignments
- **Confirmation Dialogs**: Multiple confirmation steps for destructive operations

#### **🧒 Child Management System**
- **Parent-Child Relationships**: Secure linkage between parents and their children with class enrollment tracking
- **Child Registration Portal**: Parents can add their children during account registration or later via Children Management
- **Role-Based Child Access**:
  - **Parents**: Can only view and manage their own children
  - **Class Leads**: Can view and manage children in their assigned classes
  - **Administrators**: Can view and manage all children across all classes
- **Child Enrollment Validation**: Children are linked to specific classes and parents can only book for enrolled children
- **Booking Restrictions**: Parents can only book appointments for their registered children in their enrolled classes
- **Child Data Management**:
  - Add, edit, and delete children with proper authorization
  - **Birthday Support**: Store and manage child birthdates with date picker interface
  - Class assignment validation and enforcement
  - Automatic cleanup when parents are deleted
  - Search and filtering capabilities by name, class, and parent
- **User Interface Features**:
  - Dedicated Children Management page for all user roles
  - Child selection interface in booking system
  - Real-time validation of parent-child relationships
  - Class enrollment status tracking

#### **Class Assignment Request System**
- **Request Submission Portal**: Parents and class leads can request class assignment changes
- **Admin Approval Workflow**: All class assignment changes require administrator approval
- **Request Tracking**: Users can view status and history of their requests
- **Reason Documentation**: Optional reason field for assignment change requests
- **Notification System**: Automatic notifications for request status updates
- **Historical Records**: Complete audit trail of all class assignment changes

#### **📬 Smart Notification System**
- **Real-Time Notifications**: Instant notifications for all system events and user actions
- **Interactive Click Navigation**: Clicking notifications automatically opens relevant action pages
- **Smart Routing Logic**:
  - **User Approval Requests** → Navigate directly to User Approval page
  - **Class Assignment Requests** → Navigate directly to Admin management page
  - **Informational Messages** → Mark as read without navigation (approvals/rejections)
- **Role-Based Targeting**: Notifications sent only to users with appropriate permissions
- **Visual Indicators**: 
  - Unread count badges on notification bell
  - Color-coded notification types (blue=action required, green=approved, red=rejected)
  - Actionable vs informational notification styling
- **Notification Management**: 
  - Mark as read functionality with automatic status updates
  - Notification history and audit trail
  - Real-time updates without page refresh
- **🧹 Automatic Cleanup System**: 
  - **30-Day Retention**: Notifications older than 30 days are automatically removed
  - **Daily Cleanup Schedule**: Automatic cleanup runs daily at 2:00 AM
  - **Startup Cleanup**: Cleanup runs immediately when server starts
  - **Manual Cleanup**: Administrators can trigger cleanup via API endpoint
  - **Performance Optimization**: Prevents notification table from growing indefinitely
  - **Storage Management**: Maintains optimal database size and query performance
- **Workflow Optimization**: Streamlined user experience from notification alert to task completion

#### **👥 Advanced User Management System**
- **Comprehensive User Administration**: Complete interface for managing user accounts, permissions, and activities
- **Role-Based Management Access**: 
  - **Administrators**: Can manage all user types (parents, class leads, administrators)
  - **Class Leads**: Can only manage parent users (restricted from managing other class leads or administrators)
- **Advanced Search & Filtering**:
  - Search by email or phone number
  - Filter by user status (pending, approved, rejected)
  - Filter by user role (parent, class lead, administrator)
  - Real-time filtering with instant results
- **Bulk Operations**: 
  - Multi-select checkbox interface for bulk actions
  - Bulk deactivation with confirmation dialogs
  - Bulk selection management (select all, clear selection)
- **User Account Management**:
  - **Edit User Details**: Update email, phone number, and active status
  - **Activate/Deactivate Users**: Toggle user access without data deletion
  - **View User Information**: Creation date, approval status, role assignments
  - **User Status Tracking**: Complete audit trail of user status changes
- **Security Features**:
  - Self-deletion prevention (administrators cannot deactivate themselves)
  - Permission validation for all user management actions
  - Role-based access control with strict enforcement
  - Comprehensive audit logging of all management activities
- **User Interface**:
  - Sortable and filterable data table
  - Responsive design for mobile and desktop
  - Real-time status updates and notifications
  - Intuitive edit modal with form validation

### 👥 Role-Based Permissions Matrix

#### 👑 **Administrator (Full System Control)**
**User Management:**
- ✅ Approve/reject ALL user registrations (administrators, class leads, parents)
- ✅ Bulk delete users with comprehensive audit logging
- ✅ Manage class assignment requests with approval/rejection workflow
- ✅ View system-wide user activity and audit logs
- ✅ Access complete user management dashboard
- ✅ **Advanced User Administration**: Full access to User Management page with complete user control
- ✅ **Edit User Details**: Update email, phone, and activation status for all users
- ✅ **Bulk User Operations**: Multi-select deactivation and management of user accounts

**Class & Appointment Management:**
- ✅ Create, modify, and delete classes with custom colors and descriptions
- ✅ Create and manage time slots for ALL classes system-wide
- ✅ View and manage ALL bookings across all classes
- ✅ Reset individual class schedules or entire system
- ✅ Configure global system settings (appointment duration, etc.)

**Child Management:**
- ✅ View and manage ALL children across all classes
- ✅ Create children for any parent user
- ✅ Edit child details (name, class assignments)
- ✅ Delete children with proper authorization checks
- ✅ Manage parent-child relationships and class enrollments

**System Administration:**
- ✅ Access complete admin dashboard with all features
- ✅ View comprehensive system logs and analytics
- ✅ Configure system-wide settings and preferences
- ✅ Manage API access and security settings

**Navigation Access:** All pages and features

#### 🎓 **Class Lead (Limited Administrative Access)**
**User Management:**
- ✅ Approve parent user registrations (parents only)
- ❌ Cannot approve class lead or administrator registrations
- ✅ Submit class assignment change requests
- ✅ View notifications related to assigned classes
- ✅ **Limited User Administration**: Access to User Management page for parent users only
- ✅ **Parent User Control**: Edit and deactivate/reactivate parent user accounts
- ❌ **Cannot manage other class leads or administrators** (security restriction)

**Class & Appointment Management:**
- ✅ Create and manage time slots for assigned classes only
- ✅ View and manage bookings for assigned classes only
- ✅ Reset schedules for assigned classes only
- ❌ Cannot access other classes' data or system-wide information
- ❌ Cannot modify global system settings

**Child Management:**
- ✅ View children in assigned classes only
- ✅ Create children for parent users (when assigned to their classes)
- ✅ Edit children details in assigned classes
- ✅ Delete children in assigned classes
- ❌ Cannot access children in other classes

**Restrictions:**
- ❌ No access to bulk user operations
- ❌ Cannot approve other class leads or administrators
- ❌ Cannot view system-wide audit logs or analytics
- ❌ Cannot delete users or access advanced admin features

**Navigation Access:** Home, Limited Admin Dashboard, User Approval (parents only), User Management (parents only), Class Requests

#### 👨‍👩‍👧‍👦 **Parent (Booking & Request Access)**
**Appointment Management:**
- ✅ Book appointments ONLY for registered children in enrolled classes
- ✅ Cancel/delete own bookings with confirmation
- ✅ Download calendar files (.ics) for personal bookings
- ✅ View personal booking history and upcoming appointments

**Child Management:**
- ✅ Add, edit, and delete own children
- ✅ Manage child-class enrollments (children must be enrolled to book appointments)
- ✅ View only own children in Children Management page
- ❌ Cannot access other parents' children

**Class Assignment:**
- ✅ Submit class assignment change requests with reason
- ✅ View status and history of assignment requests
- ✅ Receive notifications for request status updates

**Restrictions:**
- ❌ Cannot access any administrative functions
- ❌ Cannot approve users or manage system
- ❌ Cannot view other users' bookings or data
- ❌ Cannot create time slots or manage classes
- ❌ Cannot book appointments without registered children

**Navigation Access:** Home, Class Schedule (assigned class only), Children Management, Class Requests

### 🔄 Registration & Approval Workflow

#### **Step 1: User Registration Process**
1. **Registration Form Completion**:
   - **First Name & Last Name**: Required personal identification fields
   - Valid email address (serves as unique identifier)
   - Secure password (minimum requirements enforced)
   - Phone number (optional contact information)
   - Role selection (Parent, Class Lead, or Administrator)

2. **Enhanced Child Selection (Parents)**:
   - Choose from available classes in dropdown
   - **Smart Child Selection Modal**: Interactive popup for child management per class
   - **Existing Children Display**: Shows all available children in selected class with checkboxes
   - **Create New Children**: Inline creation with instant preview
   - **Mixed Selection**: Combine existing child selection with new child creation
   - **Visual Indicators**: Clear display showing existing vs. new children
   - System validates class availability and child enrollment requirements

3. **Child Selection Modal Workflow (Parents)**:
   - Click "Select Children" button for each chosen class
   - **Modal Features**:
     - View all existing children in the class with creation dates
     - Select multiple existing children via checkboxes
     - Create new children with inline name input
     - Preview selected children with existing/new indicators
     - Confirm selections to update registration form
   - **Benefits**: Prevents duplicate child creation and enables family account linking

4. **Account Creation**:
   - User account created with `status: 'pending'`
   - Cannot access system features until approved
   - Automatic notification sent to eligible approvers
   - Children linked to parent accounts (existing children) or created (new children)

#### **Step 5: Pending Review State**
- **Account Status**: `pending` - login disabled until approval
- **Approver Notifications**: Admins and eligible class leads receive notifications with full name display
- **Review Queue**: Applications appear in "User Approval" admin section with enhanced name presentation
- **User Display**: Shows "FirstName LastName" with email below for clear identification
- **No Auto-Approval**: All registrations require manual review and approval

#### **Step 6: Approval Authority & Rules**

**Critical Approval Restrictions:**
- 🚫 **Class leads CANNOT approve other class leads** (security measure)
- 🚫 **Class leads CANNOT approve administrators** (privilege escalation prevention)
- ✅ **Only administrators can approve class leads and other administrators**
- ⚠️ **All approval violations are logged and blocked with user feedback**

**Approval Matrix:**

| Applicant Role | Administrator Can Approve | Class Lead Can Approve | Notes |
|---|---|---|---|
| **Parent** | ✅ Yes | ✅ Yes | Any admin or class lead can approve parents |
| **Class Lead** | ✅ Yes | ❌ **NO** | **Only administrators can approve class leads** |
| **Administrator** | ✅ Yes | ❌ **NO** | **Only administrators can approve other admins** |

#### **Step 7: Approval/Rejection Process**
**Approval Actions:**
1. Approver reviews application details (full name, email, role, class assignments)
2. System validates approver has sufficient permissions
3. Click "Approve" - user status changes to `approved`
4. User receives approval notification and can immediately log in
5. Access granted based on assigned role with appropriate navigation

**Rejection Actions:**
1. Click "Reject" with optional reason for rejection
2. User account marked as `rejected` - cannot log in
3. User receives rejection notification with reason (if provided)
4. Rejection prevents future applications with same email address

### 🏫 Class Assignment Change Workflow

#### **Request Submission Process**
1. **Navigation**: Access "Request Class Assignment" from user menu
2. **Form Completion**:
   - Select desired class from dropdown (populated with available classes)
   - Provide child's name (required for parents)
   - Optional reason for assignment change (recommended for faster approval)
3. **Submission**: Request enters `pending` status in admin review queue

#### **Administrator Review Process**
1. **Request Queue**: All pending requests appear in admin dashboard
2. **Review Information**:
   - Current assignment vs. requested assignment
   - User details and provided reason
   - Class capacity and availability status
3. **Decision Actions**:
   - **Approve**: User moved to new class, old assignments cleaned up
   - **Reject**: Request denied with optional reason for user feedback

#### **Smart Notification & Tracking System**
- **Submission Confirmation**: User receives request submission confirmation
- **Admin Notifications**: Administrators receive immediate notification of new requests
- **Status Updates**: Users notified of approval/rejection decisions
- **Request History**: Complete audit trail of all assignment change requests
- **Status Tracking**: Users can view current status of pending requests
- **Click-to-Action Navigation**: Clicking notifications automatically opens relevant management pages
- **Smart Routing**: Different notification types navigate to appropriate workflow pages
- **Visual Task Indicators**: Clear distinction between actionable and informational notifications

### 🎓 Class-Based Appointment System
- **Multiple Class Management**: Create unlimited classes with custom names, colors, and descriptions
- **Per-Class Scheduling**: Each class maintains independent schedule and booking system
- **Class-Specific URLs**: Shareable direct links for each class schedule
- **Visual Class Identification**: Color-coded interface elements for easy class recognition
- **Isolated Operations**: Class-specific resets and management without affecting other classes

### 📅 Advanced Appointment Management
- **Flexible Time Slot Creation**: Batch create multiple slots using date/time ranges
- **Configurable Duration**: Customizable appointment lengths (10, 15, 20, or 30 minutes)
- **Smart Booking System**: Real-time availability checks with conflict prevention
- **Child Name Tracking**: Record child's name for each appointment booking
- **Booking Status Indicators**: Visual display of available/booked slots with occupant information
- **ICS Calendar Export**: Download `.ics` files compatible with Google Calendar, Apple Calendar, Outlook
- **Self-Service Cancellation**: Users can cancel their own bookings with confirmation dialogs
- **Automatic Slot Release**: Cancelled bookings immediately return to available pool
- **Duplicate Prevention**: Server-side validation prevents overlapping or conflicting slots

### 🌐 Complete Internationalization (i18n)
- **Multi-Language Support**: Full interface translation in French (default), English, and Dutch
- **100+ Translation Keys**: Comprehensive coverage including:
  - Authentication flow (registration, login, approval)
  - Admin interface and user management
  - Booking system and calendar integration
  - Error messages and system notifications
  - User role descriptions and permissions
  - Class assignment request workflow
- **Localized Date/Time**: Native formatting for each supported language
- **Language Persistence**: User language preference saved across sessions
- **Easy Language Switching**: Accessible language selector in main navigation

### 🎨 Modern, Responsive UI Design
- **Dark Theme**: Professional dark color scheme optimized for extended use
- **Mobile-First Responsive**: Fully functional across all device sizes and orientations
- **Tailwind CSS**: Utility-first styling with consistent design system
- **Interactive Components**: Smooth animations, hover effects, and loading states
- **Accessibility Features**: ARIA labels, keyboard navigation, semantic HTML structure
- **Visual Feedback**: Loading indicators, success messages, error displays, confirmation dialogs

### 🛡️ Security & Audit Features

#### **Authentication Security**
- **JWT Token Management**: Secure token generation with configurable expiration
- **Password Security**: Enforced minimum requirements with secure hashing
- **Session Management**: Automatic session expiration and renewal
- **Route Protection**: Server-side validation of user permissions for all endpoints
- **CORS Configuration**: Controlled cross-origin access for security

#### **Authorization Controls**
- **Role-Based Access**: Granular permissions based on user role hierarchy
- **Permission Validation**: Every action validated against user authorization level
- **Privilege Escalation Prevention**: Strict controls prevent unauthorized role changes
- **Self-Deletion Protection**: Users cannot delete their own accounts (admin safety)

#### **Comprehensive Audit Logging**
- **User Actions**: Registration, approval, rejection, role changes logged
- **Bulk Operations**: Detailed logs of mass user deletions with affected user lists
- **Class Assignments**: All assignment changes and requests tracked with timestamps
- **Administrative Actions**: Admin decisions logged with user identification
- **System Changes**: Configuration modifications and system resets documented
- **Error Tracking**: Failed authentication attempts and permission violations logged

#### **Data Integrity & Consistency**
- **Transactional Operations**: Multi-step operations ensure data consistency
- **Cascading Deletions**: User deletion properly cleans up associated data
- **Validation**: Server-side validation of all user inputs and requests
- **Error Recovery**: Graceful handling of failures with rollback capabilities

### 📊 Admin Dashboard Features

#### **User Management Interface**
- **Registration Approval Queue**: Streamlined interface for reviewing pending users
- **Bulk Operations**: Multi-select interface for efficient user management
- **User Search & Filtering**: Find users by role, status, email, or class assignment
- **Activity Monitoring**: View user login history and recent actions
- **Role Management**: Assign and modify user roles with proper authorization checks

#### **Class Management System**
- **Class Creation**: Add new classes with custom names, colors, and descriptions
- **Class Modification**: Edit existing class properties and settings
- **Class Deletion**: Remove classes with proper cleanup of associated data
- **Enrollment Management**: View and manage user assignments to classes
- **Capacity Monitoring**: Track class enrollment and availability

#### **Appointment & Schedule Management**
- **Batch Slot Creation**: Create multiple time slots using date/time ranges
- **Class-Specific Scheduling**: Manage slots independently for each class
- **Booking Overview**: View all bookings across classes with filtering options
- **Schedule Reset**: Reset individual class schedules or entire system
- **Conflict Resolution**: Identify and resolve scheduling conflicts

#### **System Configuration**
- **Global Settings**: Configure appointment duration and system-wide preferences
- **Notification Settings**: Manage email notification preferences and templates
- **Security Settings**: Configure password requirements and session timeouts
- **Data Export**: Export user data, bookings, and audit logs for reporting

### 🔗 API Architecture & Documentation

#### **RESTful API Design**
- **Consistent Endpoints**: Logical URL structure following REST conventions
- **Standard HTTP Methods**: Proper use of GET, POST, PUT, DELETE operations
- **JSON Responses**: Consistent response format with comprehensive error handling
- **Status Codes**: Appropriate HTTP status codes for all response scenarios

#### **Authentication Endpoints**
- `POST /auth/register` - User registration with role selection and class assignment
- `POST /auth/login` - User authentication with JWT token generation
- `GET /auth/profile` - Retrieve current user profile and permissions
- `POST /auth/logout` - Secure logout with token invalidation

#### **User Management Endpoints**
- `GET /auth/pending-users` - List users awaiting approval (admin/class_lead only)
- `POST /auth/approve/:userId` - Approve user registration (role-based permissions)
- `POST /auth/reject/:userId` - Reject user registration with optional reason
- `DELETE /auth/delete-users` - Bulk delete users (admin only)

#### **Class Assignment Endpoints**
- `POST /auth/request-class-assignment` - Submit class assignment change request
- `GET /auth/class-assignment-requests` - List all assignment requests (admin only)
- `POST /auth/approve-class-assignment/:requestId` - Approve assignment request
- `POST /auth/reject-class-assignment/:requestId` - Reject assignment request

#### **Comprehensive API Documentation**
- **Interactive Swagger UI**: Available at `/api/docs/ui` for live testing
- **OpenAPI Specification**: Complete API spec at `/api/openapi.json`
- **Example Requests**: Code samples for all endpoints in multiple languages
- **Authentication Guide**: Detailed instructions for JWT token usage
- **Error Reference**: Complete list of error codes and troubleshooting guide

## 🛠️ Technology Stack

### Frontend Architecture
- **React 18**: Modern hooks-based architecture with functional components
- **TypeScript 5.4**: Full type safety, IntelliSense, and compile-time error checking
- **Vite 7.1**: Lightning-fast development server with Hot Module Replacement (HMR)
- **Tailwind CSS 3.4**: Utility-first styling with custom design system
- **React Router**: Client-side routing with role-based route protection
- **React Context**: State management for authentication and user sessions
- **react-intl & i18next**: Complete internationalization framework
- **react-datepicker**: Advanced date/time selection components

### Backend Architecture
- **Express.js**: Fast, minimalist web framework for Node.js
- **Node.js**: Server-side JavaScript runtime environment
- **JWT Authentication**: JSON Web Token-based security with role-based access control
- **Passport.js**: Authentication middleware for Node.js
- **File-based Storage**: JSON database system for rapid development and deployment
- **ICS Generation**: RFC 5545 compliant calendar file generation
- **CORS Support**: Configurable cross-origin resource sharing
- **API Documentation**: Swagger/OpenAPI integration for interactive documentation

### Database Architecture
- **JSON File Storage**: Lightweight, file-based database system
- **Data Models**:
  - **Users**: Authentication, roles, and profile information
  - **Classes**: Class definitions with colors and descriptions
  - **Slots**: Time slot management with class associations
  - **Bookings**: Appointment bookings with child information
  - **UserRoles**: Role assignments and permissions
  - **UserClasses**: Class assignment relationships
  - **ClassAssignmentRequests**: Assignment change request tracking
  - **Notifications**: User notification system
  - **Config**: System configuration and settings

### Security Implementation
- **JWT Token Authentication**: Secure, stateless authentication system
- **Role-Based Authorization**: Granular permission system with three user roles
- **Password Hashing**: Secure password storage using industry-standard hashing
- **Session Management**: Automatic token expiration and renewal
- **Input Validation**: Server-side validation of all user inputs
- **CORS Protection**: Controlled cross-origin access for security
- **Audit Logging**: Comprehensive logging of all user actions and system changes

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**: Required for running the application
- **npm or yarn**: Package manager for dependency installation
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

### Quick Start Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kvaksin/rdvapp.git
   cd rdvapp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables (optional for development)
   nano .env
   ```

4. **Initialize Database** (Optional - auto-created on first run):
   ```bash
   # Reset database to default state
   npm run reset-db
   ```

5. **Start Development Servers**:
   ```bash
   # Start backend server (Terminal 1)
   npm run start:server
   
   # Start frontend development server (Terminal 2)
   npm run dev
   ```

6. **Access Application**:
   - **Frontend**: http://localhost:5174
   - **Backend API**: http://localhost:4000
   - **API Documentation**: http://localhost:4000/api/docs/ui

### Default User Accounts

The system creates default accounts for immediate testing:

```bash
# Administrator Account
Email: admin@example.com
Password: Tenbosch@123
Role: Administrator
Access: Full system control

# Class Lead Account
Email: classlead@example.com
Password: Tenbosch@123
Role: Class Lead
Access: Limited admin functions

# Parent Account
Email: parent@example.com
Password: Tenbosch@123
Role: Parent
Access: Booking and requests only
```

## 📁 Project Structure

```
rdvapp/
├── src/                           # Frontend React application
│   ├── components/                # Reusable UI components
│   │   ├── Feed.tsx              # Main content display component
│   │   ├── LeftNav.tsx           # Primary navigation sidebar
│   │   ├── RightPanel.tsx        # Secondary information panel
│   │   ├── StreamCard.tsx        # Content card component
│   │   ├── ClassAssignmentRequests.tsx # Admin class assignment management
│   │   └── NotificationBell.tsx  # Smart notification system with click-to-action navigation
│   ├── pages/                     # Application pages/routes
│   │   ├── Home.tsx              # Landing page with overview
│   │   ├── Login.tsx             # User authentication page
│   │   ├── Register.tsx          # User registration with role selection
│   │   ├── Admin.tsx             # Administrative dashboard
│   │   ├── UserApproval.tsx      # User approval management
│   │   ├── ClassRequest.tsx      # Class assignment request interface
│   │   ├── ClassSchedule.tsx     # Class-specific booking interface
│   │   ├── BookRdv.tsx           # General appointment booking
│   │   └── ApiDocs.tsx           # API documentation viewer
│   ├── contexts/                  # React context providers
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── api/                       # API client functions
│   │   └── client.ts             # HTTP client with authentication
│   ├── types/                     # TypeScript type definitions
│   │   └── api.ts                # API response and data types
│   ├── translations/              # Internationalization files
│   │   ├── fr.ts                 # French translations (default)
│   │   ├── en.ts                 # English translations
│   │   └── nl.ts                 # Dutch translations
│   ├── i18n.tsx                   # i18n configuration and hooks
│   ├── App.tsx                    # Main application component with routing
│   └── main.tsx                   # Application entry point
├── server/                        # Backend Express.js server
│   ├── index.js                  # Main server file with API endpoints
│   ├── auth.js                   # Authentication logic and user management
│   ├── authRoutes.js            # Authentication and user routes
│   ├── uploadRoutes.js          # File upload and serving routes
│   └── db.js                     # Database operations and file management
├── uploads/                       # File attachment storage (auto-generated)
│   └── YYYY-MM-DD/               # Files organized by upload date
├── data/                          # JSON database files (auto-generated)
│   ├── users.json                # User accounts and authentication
│   ├── userRoles.json            # User role assignments
│   ├── userClasses.json          # User class assignments
│   ├── classes.json              # Class definitions and properties
│   ├── slots.json                # Time slot availability
│   ├── bookings.json             # Appointment bookings
│   ├── notifications.json        # User notifications (auto-cleaned after 30 days)
│   ├── classAssignmentRequests.json # Class assignment change requests
│   └── config.json               # System configuration
├── scripts/                       # Utility scripts
│   ├── setup.sh                 # Initial setup script
│   ├── reset-db.sh              # Database reset utility
│   └── backup.sh                # Database backup script
├── docs/                          # Documentation
│   ├── API.md                    # API documentation
│   ├── DEPLOYMENT.md            # Deployment guide
│   └── DEVELOPMENT.md           # Development guidelines
├── .env.example                   # Environment variables template
├── vite.config.ts                # Vite configuration
├── tailwind.config.cjs           # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                   # Dependencies and scripts
```

## 🔗 API Reference

### Authentication Endpoints

#### User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "roles": ["parent"],
  "classAssignments": [
    {
      "classId": "class-id-here",
      "childName": "Child Name"
    }
  ]
}
```

#### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["parent"]
  }
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer jwt-token-here

Response:
{
  "id": "user-id",
  "email": "user@example.com",
  "roles": ["parent"],
  "classAssignments": [...]
}
```

### User Management Endpoints (Admin/Class Lead Only)

#### List Pending Users
```http
GET /auth/pending-users
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "user-id",
    "email": "pending@example.com",
    "roles": ["parent"],
    "status": "pending",
    "createdAt": "2025-10-18T10:00:00Z"
  }
]
```

#### Approve User
```http
POST /auth/approve/user-id
Authorization: Bearer jwt-token-here

Response:
{
  "message": "User approved successfully",
  "user": { ... }
}
```

#### Reject User
```http
POST /auth/reject/user-id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "reason": "Optional rejection reason"
}
```

#### Bulk Delete Users (Admin Only)
```http
DELETE /auth/delete-users
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "userIds": ["user-id-1", "user-id-2"]
}
```

### Class Assignment Request Endpoints

#### Submit Assignment Request
```http
POST /auth/request-class-assignment
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "classId": "new-class-id",
  "childName": "Child Name",
  "reason": "Reason for class change"
}
```

#### List Assignment Requests (Admin Only)
```http
GET /auth/class-assignment-requests
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "request-id",
    "userId": "user-id",
    "classId": "requested-class-id",
    "reason": "Reason for change",
    "status": "pending",
    "createdAt": "2025-10-18T10:00:00Z"
  }
]
```

#### Approve Assignment Request (Admin Only)
```http
POST /auth/approve-class-assignment/request-id
Authorization: Bearer jwt-token-here
```

#### Reject Assignment Request (Admin Only)
```http
POST /auth/reject-class-assignment/request-id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "reason": "Rejection reason"
}
```

### Children Management Endpoints

#### List Children
```http
GET /auth/children
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "child-id",
    "name": "Emma Smith",
    "parentId": "parent-user-id",
    "classId": "class-id",
    "createdAt": "2025-10-18T10:00:00Z"
  }
]
```

#### Add Child
```http
POST /auth/children
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "New Child Name",
  "parentId": "parent-user-id",
  "classId": "class-id"
}
```

#### Update Child
```http
PUT /auth/children/child-id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "Updated Child Name",
  "classId": "new-class-id"
}
```

#### Delete Child
```http
DELETE /auth/children/child-id
Authorization: Bearer jwt-token-here
```

#### Get Children by Class
```http
GET /auth/children/class/class-id
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "child-id",
    "name": "Emma Smith",
    "parentId": "parent-user-id",
    "classId": "class-id",
    "createdAt": "2025-10-18T10:00:00Z"
  }
]
```

### Notification Management Endpoints

#### Get User Notifications
```http
GET /auth/notifications
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "notification-id",
    "type": "user_approval_request",
    "recipientId": "admin-user-id",
    "senderId": "new-user-id",
    "senderEmail": "newuser@example.com",
    "userRole": "parent",
    "message": "New parent registration: newuser@example.com",
    "isRead": false,
    "createdAt": "2025-10-18T10:00:00Z",
    "status": "pending",
    "metadata": {
      "requestId": "request-id",
      "userEmail": "newuser@example.com",
      "className": "Math Class"
    }
  }
]
```

### Communication Management Endpoints

#### Get User Messages
```http
GET /api/messages
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "message-id",
    "senderId": "sender-user-id",
    "senderName": "John Smith",
    "senderRole": "administrator",
    "type": "admin_to_class",
    "subject": "Important Update",
    "message": "Please note the schedule change for next week.",
    "classIds": ["class-id-1", "class-id-2"],
    "childIds": [],
    "recipients": ["parent-id-1", "parent-id-2", "classlead-id"],
    "createdAt": "2025-10-19T10:00:00Z",
    "readBy": ["parent-id-1"]
  }
]
```

#### Send Admin to Class Message
```http
POST /api/messages/admin-to-class
Authorization: Bearer jwt-token-here (Administrator only)
Content-Type: application/json

{
  "subject": "Schedule Update",
  "message": "The class schedule has been updated for next week.",
  "classIds": ["class-id-1", "class-id-2"]
}

Response:
{
  "message": "Message sent successfully",
  "messageId": "message-id",
  "recipientCount": 15
}
```

#### Send Class Lead to Parents Message
```http
POST /api/messages/class-lead-to-parents
Authorization: Bearer jwt-token-here (Class Lead or Administrator)
Content-Type: application/json

{
  "subject": "Homework Reminder",
  "message": "Don't forget about tomorrow's assignment.",
  "childIds": ["child-id-1", "child-id-2"]
}
# OR
{
  "subject": "Class Announcement",
  "message": "Class will be held in Room 205 tomorrow.",
  "classIds": ["class-id"]
}

Response:
{
  "message": "Message sent successfully",
  "messageId": "message-id",
  "recipientCount": 8
}
```

#### Send Parent to Class Lead Message
```http
POST /api/messages/parent-to-class-lead
Authorization: Bearer jwt-token-here (Parent only)
Content-Type: application/json

{
  "subject": "Question about homework",
  "message": "Could you clarify the math assignment?",
  "classIds": ["class-id"]
}

Response:
{
  "message": "Message sent successfully",
  "messageId": "message-id",
  "recipientCount": 2
}
```

#### Mark Message as Read
```http
PUT /api/messages/message-id/read
Authorization: Bearer jwt-token-here

Response:
{
  "message": "Message marked as read",
  "messageId": "message-id"
}
```

#### Get Children for Messaging
```http
GET /api/messages/children-for-messaging
Authorization: Bearer jwt-token-here (Class Lead or Administrator)

Response:
[
  {
    "id": "child-id",
    "firstName": "Emma",
    "lastName": "Smith",
    "classId": "class-id",
    "className": "Mathematics",
    "parents": [
      {
        "id": "parent-id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ]
  }
]
```

**Communication Message Types:**
- `admin_to_class` - Administrator broadcasting to classes (reaches parents and class leads)
- `class_lead_to_parents` - Class lead messaging parents of specific children or entire classes
- `parent_to_class_lead` - Parent messaging class leads for enrolled classes

**Permission Rules:**
- **Administrators**: Can send admin_to_class messages to any classes
- **Class Leads**: Can send class_lead_to_parents messages for their assigned classes
- **Parents**: Can send parent_to_class_lead messages for classes their children are enrolled in
- **Message Access**: Users only see messages they are recipients of or have sent

**Data Retention:**
- **Automatic Cleanup**: Messages older than 2 weeks are automatically deleted
- **Daily Cleanup Schedule**: Cleanup runs every day at 2:00 AM server time
- **Performance Optimization**: Prevents message accumulation for optimal system performance

### File Upload Management Endpoints

#### Upload Files
```http
POST /api/uploads
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data

Form Data:
files: [File objects] (up to 5 files, 5MB each)

Response:
{
  "files": [
    {
      "id": "upload-id-1",
      "originalName": "document.pdf",
      "filename": "unique-filename.pdf",
      "mimetype": "application/pdf",
      "size": 1024000,
      "uploadedAt": "2025-10-19T14:30:00Z"
    }
  ]
}
```

#### Download File
```http
GET /api/uploads/unique-filename.pdf
Authorization: Bearer jwt-token-here

Response: File download (requires proper authentication)
```

**File Upload Validation:**
- **File Types**: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, TXT, CSV
- **Size Limit**: 5MB per file maximum
- **Quantity Limit**: Maximum 5 files per upload
- **Security**: File type validation and sanitization
- **Storage**: Organized by date with unique filenames

**Integration with Messages:**
All message endpoints (admin-to-class, class-lead-to-parents, parent-to-class-lead) accept an optional `attachments` array containing attachment objects returned from the upload endpoint.

#### Mark Notification as Read
```http
POST /auth/notifications/notification-id/read
Authorization: Bearer jwt-token-here

Response:
{
  "id": "notification-id",
  "isRead": true,
  "message": "Notification marked as read"
}
```

#### Cleanup Old Notifications (Admin Only)
```http
POST /auth/notifications/cleanup
Authorization: Bearer jwt-token-here

Response:
{
  "message": "Notification cleanup completed",
  "result": {
    "initialCount": 45,
    "remainingCount": 23,
    "removedCount": 22
  }
}
```

**Cleanup Features:**
- **Automatic Daily Cleanup**: Runs every day at 2:00 AM
- **Startup Cleanup**: Executes when server starts
- **30-Day Retention**: Removes notifications older than 30 days
- **Admin Manual Control**: Administrators can trigger cleanup on-demand
- **Performance Benefits**: Maintains optimal database size and query speed
- **Audit Logging**: All cleanup operations are logged for monitoring

**Notification Types:**
- `user_approval_request` - New user registration requiring approval
- `user_approved` - User account has been approved
- `user_rejected` - User account has been rejected
- `class_assignment_request` - Request for class assignment change
- `class_assignment_approved` - Class assignment request approved
- `class_assignment_rejected` - Class assignment request rejected

**Smart Navigation:**
- Frontend automatically navigates to appropriate pages when notifications are clicked
- Actionable notifications (approval/assignment requests) open relevant management pages
- Informational notifications (approved/rejected) are marked as read only

### User Management Endpoints

#### Get All Users (Admin/Class Lead Only)
```http
GET /auth/users
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "user-id",
    "email": "user@example.com",
    "phone": "123-456-7890",
    "isActive": true,
    "status": "approved",
    "createdAt": "2025-10-18T10:00:00Z",
    "roles": ["parent"],
    "classAssignments": [
      {
        "id": "assignment-id",
        "classId": "class-id",
        "childName": "Child Name",
        "createdAt": "2025-10-18T10:00:00Z"
      }
    ]
  }
]
```

**Note**: Class leads only see parent users, administrators see all users.

#### Update User
```http
PUT /auth/users/user-id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "987-654-3210",
  "isActive": true
}

Response:
{
  "message": "User updated successfully",
  "user": { ... }
}
```

#### Deactivate User
```http
POST /auth/users/user-id/deactivate
Authorization: Bearer jwt-token-here

Response:
{
  "message": "User deactivated successfully",
  "user": { ... }
}
```

#### Reactivate User
```http
POST /auth/users/user-id/reactivate
Authorization: Bearer jwt-token-here

Response:
{
  "message": "User reactivated successfully",
  "user": { ... }
}
```

#### Bulk Deactivate Users
```http
POST /auth/users/bulk-deactivate
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "userIds": ["user-id-1", "user-id-2", "user-id-3"]
}

Response:
{
  "message": "Successfully deactivated 3 users",
  "result": {
    "deactivated": 3,
    "errors": [],
    "total": 3
  }
}
```

**Permission Rules:**
- **Administrators**: Can manage all user types
- **Class Leads**: Can only manage parent users (cannot manage other class leads or administrators)
- **Self-Protection**: Users cannot deactivate their own accounts

### Child Management Endpoints

#### Get Children
```http
GET /api/children?classId=class-id
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "child-id",
    "parentId": "parent-user-id",
    "name": "Child Name",
    "classId": "class-id",
    "createdAt": "2025-10-19T10:00:00Z",
    "updatedAt": "2025-10-19T10:00:00Z"
  }
]
```

**Permissions**:
- **Parents**: See only their own children
- **Class Leads**: See children in their assigned classes
- **Administrators**: See all children (optionally filtered by classId)

#### Get Specific Child
```http
GET /api/children/child-id
Authorization: Bearer jwt-token-here

Response:
{
  "id": "child-id",
  "parentId": "parent-user-id",
  "name": "Child Name",
  "classId": "class-id",
  "createdAt": "2025-10-19T10:00:00Z",
  "updatedAt": "2025-10-19T10:00:00Z"
}
```

#### Create Child
```http
POST /api/children
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "Child Name",
  "classId": "class-id",
  "parentId": "parent-user-id"  // Optional for parents (defaults to current user)
}

Response:
{
  "id": "child-id",
  "parentId": "parent-user-id",
  "name": "Child Name",
  "classId": "class-id",
  "createdAt": "2025-10-19T10:00:00Z",
  "updatedAt": "2025-10-19T10:00:00Z"
}
```

**Permissions**:
- **Parents**: Can only create children for themselves
- **Class Leads**: Can create children for parents in their classes
- **Administrators**: Can create children for any parent

#### Update Child
```http
PUT /api/children/child-id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "Updated Child Name",
  "classId": "new-class-id"
}

Response:
{
  "id": "child-id",
  "parentId": "parent-user-id",
  "name": "Updated Child Name",
  "classId": "new-class-id",
  "createdAt": "2025-10-19T10:00:00Z",
  "updatedAt": "2025-10-19T11:00:00Z"
}
```

#### Delete Child
```http
DELETE /api/children/child-id
Authorization: Bearer jwt-token-here

Response:
{
  "message": "Child deleted successfully"
}
```

**Permission Rules for Child Management**:
- **Parents**: Can only manage their own children
- **Class Leads**: Can manage children in their assigned classes
- **Administrators**: Can manage all children
- **Child-Class Validation**: Children must be enrolled in classes before booking appointments
- **Booking Restrictions**: Parents can only book for their registered children

### Class Management Endpoints

#### List Classes
```http
GET /api/classes
Authorization: Bearer jwt-token-here

Response:
[
  {
    "id": "class-id",
    "name": "Mathematics",
    "description": "Elementary math classes",
    "color": "#3B82F6",
    "createdAt": "2025-10-18T10:00:00Z"
  }
]
```

#### Create Class (Admin Only)
```http
POST /api/classes
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "New Class",
  "description": "Class description",
  "color": "#10B981"
}
```

#### Delete Class (Admin Only)
```http
DELETE /api/classes/class-id
Authorization: Bearer jwt-token-here
```

### Slot Management Endpoints

#### List Slots
```http
GET /api/slots?classId=class-id&from=2025-10-18&to=2025-10-25
Authorization: Bearer jwt-token-here
```

#### Create Time Slots
```http
POST /api/slots/timeframe
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "start": "2025-10-18T09:00:00Z",
  "end": "2025-10-18T17:00:00Z",
  "classId": "class-id"
}
```

#### Delete Slot
```http
DELETE /api/slots/slot-id
Authorization: Bearer jwt-token-here
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "slotId": "slot-id",
  "childName": "Child Name"
}
```

#### List Bookings
```http
GET /api/bookings
Authorization: Bearer jwt-token-here
```

#### Cancel Booking
```http
DELETE /api/bookings/booking-id
Authorization: Bearer jwt-token-here
```

#### Download ICS Calendar File
```http
GET /api/bookings/booking-id/ics
Authorization: Bearer jwt-token-here

Response: calendar.ics file download
```

### System Configuration Endpoints

#### Get Configuration
```http
GET /api/config
Authorization: Bearer jwt-token-here

Response:
{
  "rdvDurationMinutes": 15
}
```

#### Update Configuration (Admin Only)
```http
PUT /api/config
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "rdvDurationMinutes": 20
}
```

### System Maintenance Endpoints (Admin Only)

#### Reset Entire System
```http
POST /api/reset
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "confirm": true
}
```

#### Reset Class Schedule
```http
POST /api/reset-class
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "classId": "class-id",
  "confirm": true
}
```

## 💻 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start Vite frontend dev server
npm run start:server     # Start Express backend server
npm run build           # Build production bundle
npm run preview         # Preview production build locally

# Testing & Quality
npm run test            # Run test suite
npm run test:e2e        # Run end-to-end tests
npm run lint            # Run ESLint code linting
npm run type-check      # Run TypeScript type checking

# Database Management
npm run reset-db        # Reset database to initial state
npm run backup-db       # Create database backup
npm run restore-db      # Restore database from backup

# Deployment
npm run deploy:staging  # Deploy to staging environment
npm run deploy:prod     # Deploy to production environment
```

### Development Environment Setup

#### Port Configuration
- **Frontend Development**: http://localhost:5174 (Vite dev server)
- **Backend API**: http://localhost:4000 (Express server)
- **API Documentation**: http://localhost:4000/api/docs/ui (Swagger UI)

#### Environment Variables
Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development
BASE_URL=http://localhost:5174

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Database
DATA_DIR=./data

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS Configuration
CORS_ORIGIN=http://localhost:5174

# API Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=900000

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### Database Management

#### File-Based Storage Structure
The application uses JSON files for data persistence:

```bash
data/
├── users.json               # User accounts and authentication
├── userRoles.json          # Role assignments
├── userClasses.json        # Class assignments
├── classes.json            # Class definitions
├── slots.json              # Time slot data
├── bookings.json           # Appointment bookings
├── notifications.json      # User notifications (auto-cleaned after 30 days)
├── classAssignmentRequests.json # Assignment requests
└── config.json             # System configuration
```

#### Database Operations

**Reset Database to Default State:**
```bash
# Complete system reset
curl -X POST http://localhost:4000/api/reset \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'

# Reset specific class
curl -X POST http://localhost:4000/api/reset-class \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"classId": "class-id", "confirm": true}'
```

**Backup Database:**
```bash
# Create timestamped backup
cp -r data/ backup-$(date +%Y%m%d-%H%M%S)/
```

**Restore Database:**
```bash
# Restore from backup
cp -r backup-20251018-120000/ data/
```

### User Roles & Permissions

#### 👑 **Administrator**
**Full System Access:**
- ✅ Create, modify, and delete classes
- ✅ Create and manage time slots for all classes
- ✅ View and manage all bookings system-wide
- ✅ Approve/reject ALL user registrations (including class leads)
- ✅ Bulk delete users with full audit logging
- ✅ Approve/reject class assignment requests
- ✅ Access all admin dashboard sections
- ✅ Reset entire system or individual class schedules
- ✅ Configure global system settings (appointment duration)
- ✅ View comprehensive audit logs and notifications

**Navigation Access:** Home, Admin Dashboard, User Approval, All Features

#### 🎓 **Class Lead**
**Limited Administrative Access:**
- ✅ Create and manage time slots for assigned classes only
- ✅ View and manage bookings for assigned classes only
- ✅ Approve parent user registrations (NOT other class leads)
- ✅ Request class assignment changes
- ✅ Reset schedules for assigned classes only
- ❌ Cannot approve other class lead registrations
- ❌ Cannot delete users or access bulk operations
- ❌ Cannot modify global system settings
- ❌ Cannot access system-wide audit logs

**Navigation Access:** Home, Admin Dashboard (limited), User Approval (parents only), Class Requests

#### 👨‍👩‍👧‍👦 **Parent**
**Booking and Request Access:**
- ✅ Book appointments for children in assigned class
- ✅ Cancel/delete own bookings
- ✅ Download calendar files (.ics) for bookings
- ✅ Request class assignment changes
- ✅ View own booking history and request status
- ❌ Cannot access admin functions
- ❌ Cannot approve users or manage system
- ❌ Cannot view other users' bookings

**Navigation Access:** Home, Class Schedule (for assigned class), Class Requests

### Registration & Approval Workflow

#### 📝 **Step 1: User Registration**
1. **User visits `/register`** and provides:
   - Email address (unique identifier)
   - Secure password (minimum 6 characters)
   - Phone number (optional)
   - Role selection (Parent, Class Lead, or Administrator)

2. **Class Assignment** (for Parents and Class Leads):
   - Select from available classes
   - Provide child's name (required for parents)
   - System validates class availability

3. **Account Creation**:
   - User account created with `status: 'pending'`
   - Cannot access system until approved
   - Automatic notification sent to approvers

#### ⏳ **Step 2: Pending Approval State**
- **User Status**: `pending` - cannot log in
- **Visibility**: Account appears in admin "User Approval" section
- **Notifications**: Admins and eligible class leads receive notifications
- **Waiting Period**: No automatic approval - manual review required

#### 👥 **Step 3: Approval Authority Rules**

**WHO CAN APPROVE WHOM:**

| Applicant Role | Can be Approved by | Approval Rules |
|---|---|---|
| **Parent** | ✅ Administrator<br>✅ Class Lead | Any admin or class lead can approve parents |
| **Class Lead** | ✅ Administrator ONLY | **Strict Rule**: Only administrators can approve class leads |
| **Administrator** | ✅ Administrator ONLY | Only existing admins can create new admins |

**CRITICAL APPROVAL RESTRICTIONS:**
- 🚫 **Class leads CANNOT approve other class leads**
- 🚫 **Class leads CANNOT approve administrators** 
- ✅ **Only administrators have universal approval rights**
- ⚠️ **Violation attempts are logged and blocked**

#### ✅ **Step 4: Approval Process**
1. **Approver Reviews Application**:
   - Views user email, role, and class assignments
   - Sees child name (for parent applications)
   - Reviews any additional information

2. **Approval Action**:
   - Click "Approve" button
   - System validates approver permissions
   - User status changed to `approved`
   - User can immediately log in

3. **Post-Approval Setup**:
   - User receives approval notification
   - Access granted based on assigned role
   - Class assignments activated
   - Navigation menu updates based on permissions

#### ❌ **Step 5: Rejection Process**
1. **Rejection Action**:
   - Click "Reject" button
   - Optionally provide rejection reason
   - User receives rejection notification

2. **Post-Rejection**:
   - User account marked as `rejected`
   - Cannot log in or reapply with same email
   - Rejection reason stored for audit

### Class Assignment Change Workflow

#### 📋 **Request Submission** (Parents & Class Leads)
1. **Navigate to "Request Class Assignment"**
2. **Select Desired Class** from available options
3. **Provide Details**:
   - Child's name (required for parents)
   - Reason for change (optional but recommended)
4. **Submit Request** - enters `pending` status

#### 🔍 **Admin Review Process**
1. **Request Appears** in admin dashboard "Class Assignment Requests" section
2. **Admin Reviews**:
   - Current assignment vs. requested assignment
   - User details and reason provided
   - Class capacity and availability
3. **Decision Making**:
   - **Approve**: User moved to new class, old assignment removed
   - **Reject**: Request denied with optional reason

#### 📬 **Notification System**
- **Request Submitted**: Admin receives notification
- **Request Approved**: User receives approval notification
- **Request Rejected**: User receives rejection with reason
- **All Actions**: Logged for audit trail

### Security & Audit Features

#### 🔒 **Enhanced Security Measures**
- **Role-Based Route Protection**: Pages restricted by user role
- **API Authorization**: All endpoints verify user permissions AND approval status
- **Session Management**: JWT-based authentication with expiration
- **Status-Based Access Control**: Real-time user status validation on every request
- **Self-Deletion Prevention**: Admins cannot delete their own accounts
- **Validation**: Server-side validation of all user actions
- **Security Audit Trail**: All authentication failures and status violations logged

#### 📊 **Audit Logging**
- **User Actions**: All approvals, rejections, deletions logged
- **Bulk Operations**: Detailed logs of mass user operations
- **Class Changes**: Assignment modifications tracked
- **Admin Actions**: Administrative decisions recorded
- **Timestamps**: All actions include precise timestamps

#### 🚨 **Error Handling**
- **Permission Violations**: Logged and blocked with user feedback
- **Invalid Requests**: Graceful handling with descriptive errors
- **System Failures**: Automatic error recovery and user notification
- **Data Consistency**: Transactional operations prevent data corruption

### Best Practices for Administrators

#### ✅ **User Approval Guidelines**
1. **Verify Identity**: Ensure email addresses are legitimate
2. **Check Class Capacity**: Confirm class can accommodate new members
3. **Role Appropriateness**: Verify role selection matches intended function
4. **Documentation**: Use rejection reasons for record-keeping
5. **Timely Processing**: Approve/reject within reasonable timeframe

#### ⚠️ **Security Considerations**
1. **Class Lead Approvals**: Extra scrutiny for class lead applications
2. **Bulk Operations**: Double-check before mass deletions
3. **System Access**: Regularly review user access and permissions
4. **Audit Reviews**: Periodically check system logs
5. **Password Security**: Enforce strong password requirements

This comprehensive role-based system ensures secure, organized user management while maintaining clear approval workflows and audit trails for accountability.

### 👶 Children Management System

The application includes a comprehensive children management system to streamline booking processes and improve user experience.

#### **Database Structure**
- **Children Storage**: Dedicated `data/children.json` file stores child information
- **Child Associations**: Links children to parents and classes for organized tracking
- **Automatic Population**: Child names auto-populate in booking forms for parents

#### **Children Data Model**
```typescript
interface Child {
  id: string          // Unique identifier
  name?: string       // Legacy field for backward compatibility
  firstName: string   // Child's first name
  lastName: string    // Child's last name
  birthday?: string   // Child's birthday (optional, YYYY-MM-DD format)
  parentId: string    // Associated parent user ID
  classId: string     // Assigned class ID
  createdAt: string   // Creation timestamp
  updatedAt?: string  // Last modification timestamp
}
```

#### **API Endpoints for Children Management**
- `GET /auth/children` - List all children (filtered by parent for regular users)
- `POST /auth/children` - Add new child
- `PUT /auth/children/:childId` - Update child information
- `DELETE /auth/children/:childId` - Remove child
- `GET /auth/children/class/:classId` - Get all children in specific class

#### **Registration Experience Enhancement**
1. **Existing Children Display**: When selecting a class during registration, existing children for that class are shown as clickable buttons
2. **Quick Selection**: Parents can click on existing child names instead of typing manually
3. **New Child Addition**: Text input remains available for adding new children to classes
4. **Validation**: System prevents duplicate child names within the same class

#### **Booking Experience Enhancement**
1. **Auto-Population**: Booking forms automatically show parent's children as selectable options
2. **Quick Selection**: Click buttons to select existing children for appointments
3. **Manual Entry**: Text input available for entering new child names
4. **Data Consistency**: Ensures accurate child name recording across all bookings

#### **Benefits**
- **Reduced Errors**: Eliminates typos in child names through pre-populated options
- **Faster Booking**: Quick selection from existing children speeds up appointment creation
- **Better UX**: Parents see familiar names and can easily manage multiple children
- **Data Integrity**: Consistent child name formatting across the system

### 📅 Advanced Appointment Management
- **Flexible Time Slot Creation**: Create multiple time slots in batch using date/time ranges
- **Configurable Duration**: Set appointment durations (10, 15, 20, or 30 minutes)
- **Smart Booking System**: Prevents double-booking with real-time availability checks and one-booking-per-child policy
- **Child Name Tracking**: Each booking records the child's name for easy identification
- **Booking Status Display**: Visual indicators for available/booked slots with child names
- **ICS Calendar Export**: Download `.ics` files for booked appointments (Google/Apple/Outlook compatible)
- **Delete Bookings**: Users can delete/cancel their appointments with confirmation dialog
- **Automatic Slot Release**: Deleted bookings immediately make slots available again
- **Duplicate Prevention**: Automatic detection and prevention of overlapping slots per class

### 🚫 **Booking Policies & Restrictions**
- **One Booking Per Child**: Each child can only maintain one active appointment at a time
- **Multi-Parent Protection**: When multiple parents are registered for the same child, only one can book
- **Automatic Conflict Detection**: System checks for existing bookings before allowing new ones
- **Clear Error Messaging**: Users receive detailed information when booking restrictions apply
- **Existing Booking Information**: Shows details of current booking when restrictions are triggered
- **Fair Access Policy**: Ensures equal opportunity for all families to secure appointments
- **Cancellation Required**: To book a new appointment, existing booking must be cancelled first

### 🌐 Complete Internationalization (i18n)
- **Multi-Language Support**: Full UI translation in French (default), English, and Dutch
- **61 Translation Keys**: All user-facing text is translatable including:
  - Admin interface labels and messages
  - Booking modal and forms
  - Error messages and confirmations
  - Status indicators and buttons
  - Delete confirmation dialogs
- **Localized Date/Time**: Native date and time formatting for each language
- **Language Persistence**: Selected language saved in browser storage
- **Easy Language Switching**: Dropdown selector with native language names

### 🎨 Modern, Responsive UI
- **Dark Theme**: Elegant dark color scheme optimized for readability
- **Mobile-First Design**: Fully responsive layout for all screen sizes
- **Tailwind CSS**: Utility-first styling with custom color palette (purple/gray theme)
- **Interactive Components**: Smooth hover effects, transitions, and loading states
- **Accessible Design**: Semantic HTML, ARIA labels, keyboard navigation support
- **Visual Feedback**: Loading states, confirmation messages, error displays

### � Admin Dashboard
- **Class Management**:
  - Create classes with custom names and colors
  - Delete classes (slots are unlinked, not deleted)
  - Visual class list with color indicators
  - Shareable class schedule URLs with copy-to-clipboard
- **Slot Creation**:
  - Batch create slots by date and time range
  - Assign slots to specific classes or leave unassigned
  - Visual class selector moved to top for easy access
  - Date picker with time input controls (with increment/decrement buttons)
- **Slot Management**:
  - View all available slots filtered by class
  - Delete individual slots
  - Reset entire class schedules (slots + bookings)
  - Color-coded slot display matching class colors
- **Configuration**:
  - Set global appointment duration
  - Visual duration selector (10/15/20/30 minutes)
  - Persistent configuration storage

### 📊 Real-Time Data Management
- **Automatic Refresh**: Data updates after bookings/changes
- **Conflict Prevention**: Server-side validation prevents race conditions
- **Error Recovery**: Graceful error handling with user-friendly messages
- **State Synchronization**: UI reflects current server state
- **Optimistic Updates**: Immediate UI feedback with rollback on errors

### 🔗 API Features
- **RESTful API**: Clean, well-documented endpoints
- **Swagger Documentation**: Interactive API docs at `/api/docs/ui`
- **OpenAPI Spec**: Full API specification at `/api/openapi.json`
- **Health Checks**: `/api/health` and `/api/ping` endpoints
- **CORS Support**: Configurable cross-origin access
- **JSON Responses**: Consistent response format with error handling

## 🛠️ Technology Stack

### Frontend Architecture
- **React 18**: Modern hooks-based architecture with functional components
- **TypeScript 5.4**: Full type safety, IntelliSense, and compile-time error checking
- **Vite 7.1**: Lightning-fast development server with Hot Module Replacement (HMR)
- **Tailwind CSS 3.4**: Utility-first styling with custom design system
- **React Router**: Client-side routing with role-based route protection
- **React Context**: State management for authentication and user sessions
- **react-intl & i18next**: Complete internationalization framework
- **react-datepicker**: Advanced date/time selection components

### Backend Architecture
- **Express.js**: Fast, minimalist web framework for Node.js
- **Node.js**: Server-side JavaScript runtime environment
- **JWT Authentication**: JSON Web Token-based security with role-based access control
- **Passport.js**: Authentication middleware for Node.js
- **File-based Storage**: JSON database system for rapid development and deployment
- **ICS Generation**: RFC 5545 compliant calendar file generation
- **CORS Support**: Configurable cross-origin resource sharing
- **API Documentation**: Swagger/OpenAPI integration for interactive documentation

### Database Architecture
- **JSON File Storage**: Lightweight, file-based database system
- **Data Models**:
  - **Users**: Authentication, roles, and profile information
  - **Classes**: Class definitions with colors and descriptions
  - **Slots**: Time slot management with class associations
  - **Bookings**: Appointment bookings with child information
  - **UserRoles**: Role assignments and permissions
  - **UserClasses**: Class assignment relationships
  - **ClassAssignmentRequests**: Assignment change request tracking
  - **Notifications**: User notification system
  - **Config**: System configuration and settings

### Security Implementation
- **JWT Token Authentication**: Secure, stateless authentication system
- **Role-Based Authorization**: Granular permission system with three user roles
- **Password Hashing**: Secure password storage using industry-standard hashing
- **Session Management**: Automatic token expiration and renewal
- **Input Validation**: Server-side validation of all user inputs
- **CORS Protection**: Controlled cross-origin access for security
- **Audit Logging**: Comprehensive logging of all user actions and system changes

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**: Required for running the application
- **npm or yarn**: Package manager for dependency installation
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

### Quick Start Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kvaksin/rdvapp.git
   cd rdvapp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables (optional for development)
   nano .env
   ```

4. **Initialize Database** (Optional - auto-created on first run):
   ```bash
   # Reset database to default state
   npm run reset-db
   ```

5. **Start Development Servers**:
   ```bash
   # Start backend server (Terminal 1)
   npm run start:server
   
   # Start frontend development server (Terminal 2)
   npm run dev
   ```

6. **Access Application**:
   - **Frontend**: http://localhost:5174
   - **Backend API**: http://localhost:4000
   - **API Documentation**: http://localhost:4000/api/docs/ui

### Default User Accounts

The system creates default accounts for immediate testing:

```bash
# Administrator Account
Email: admin@example.com
Password: Tenbosch@123
Role: Administrator
Access: Full system control

# Class Lead Account
Email: classlead@example.com
Password: Tenbosch@123
Role: Class Lead
Access: Limited admin functions

# Parent Account
Email: parent@example.com
Password: Tenbosch@123
Role: Parent
Access: Booking and requests only
```
   ```bash
   npx prisma migrate reset --force
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## 📁 Project Structure

```
rdvapp/
├── src/                           # Frontend source code
│   ├── components/                # Reusable React components
│   │   ├── Feed.tsx              # Main content feed component
│   │   ├── LeftNav.tsx           # Navigation sidebar
│   │   ├── RightPanel.tsx        # Right sidebar panel
│   │   ├── StreamCard.tsx        # Stream card component
│   │   ├── ClassAssignmentRequests.tsx # Class assignment request management
│   │   └── NotificationBell.tsx  # Smart notification system with click-to-action navigation
│   ├── pages/                     # Page components
│   │   ├── Admin.tsx             # Admin dashboard (class & slot management)
│   │   ├── ApiDocs.tsx           # API documentation viewer
│   │   ├── BookRdv.tsx           # General booking page
│   │   ├── ClassSchedule.tsx     # Class-specific schedule & booking
│   │   ├── ClassRequest.tsx      # Class assignment request page
│   │   ├── UserApproval.tsx      # User approval management page
│   │   ├── Login.tsx             # User authentication
│   │   ├── Register.tsx          # User registration with role selection
│   │   └── Home.tsx              # Landing page
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx       # Authentication context and hooks
│   ├── translations/              # i18n language files
│   │   ├── fr.ts                 # French translations (default)
│   │   ├── en.ts                 # English translations
│   │   └── nl.ts                 # Dutch translations
│   ├── api/                       # API client utilities
│   │   └── client.ts             # API methods (fetch, book, create, etc.)
│   ├── types/                     # TypeScript type definitions
│   │   └── api.ts                # API response types
│   ├── i18n.tsx                   # i18n configuration & language hook
│   ├── App.tsx                    # Main app component with routing
│   └── main.tsx                   # React app entry point
├── server/                        # Backend Express.js server
│   ├── index.js                  # Express app & API endpoints
│   ├── auth.js                   # Authentication logic and user management
│   ├── authRoutes.js            # Authentication and user management routes
│   └── db.js                     # File-based database operations
├── data/                          # JSON database files
│   ├── classes.json              # Class data
│   ├── slots.json                # Time slot data
│   ├── bookings.json             # Booking data
│   ├── config.json               # App configuration
│   ├── users.json                # User accounts
│   ├── userRoles.json            # User role assignments
│   ├── userClasses.json          # User class assignments
│   ├── notifications.json        # User notifications (auto-cleaned after 30 days)
│   └── classAssignmentRequests.json # Class assignment change requests
├── prisma/                        # Database schema (reference)
│   └── schema.prisma             # Prisma schema definition
├── public/                        # Static assets
├── openapi.yaml                   # OpenAPI/Swagger specification
├── vite.config.ts                # Vite configuration
├── tailwind.config.cjs           # Tailwind CSS configuration
└── package.json                   # Dependencies and scripts
```

## 🚀 API Endpoints

### Classes
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create new class (body: `{ name, color, description? }`)
- `DELETE /api/classes/:id` - Delete class (unlinks slots)

### Slots
- `GET /api/slots` - List slots (query: `from`, `to`, `classId`)
- `POST /api/slots/timeframe` - Create multiple slots (body: `{ start, end, classId? }`)
- `DELETE /api/slots/:id` - Delete (soft remove) a slot

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking (body: `{ slotId, childName }`)
- `PUT /api/bookings/:id` - Reschedule booking (body: `{ slotId, childName }`)
- `DELETE /api/bookings/:id` - Cancel/delete booking (releases slot automatically)
- `GET /api/bookings/:id/ics` - Download ICS calendar file

### Configuration
- `GET /api/config` - Get current config
- `PUT /api/config` - Update config (body: `{ rdvDurationMinutes }`)

### Authentication & User Management
- `POST /auth/register` - Register new user (body: `{ email, password, roles, classAssignments }`)
- `POST /auth/login` - Login user (body: `{ email, password }`)
- `GET /auth/profile` - Get current user profile
- `GET /auth/pending-users` - List pending user registrations (admin/class_lead only)
- `POST /auth/approve/:userId` - Approve user registration (admin only for class leads)
- `POST /auth/reject/:userId` - Reject user registration (body: `{ reason? }`)
- `POST /auth/delete-users` - Bulk delete users (admin only, body: `{ userIds }`)

### Class Assignment Requests
- `POST /auth/request-class-assignment` - Submit class assignment request
- `GET /auth/class-assignment-requests` - List all class assignment requests (admin only)
- `POST /auth/approve-class-assignment/:requestId` - Approve class assignment request (admin only)
- `POST /auth/reject-class-assignment/:requestId` - Reject class assignment request (admin only, body: `{ reason? }`)

### Notifications
- `GET /auth/notifications` - Get user notifications with smart navigation metadata
- `POST /auth/notifications/:notificationId/read` - Mark notification as read
- `POST /auth/notifications/cleanup` - Cleanup old notifications (admin only, 30+ days retention)

### Admin
- `POST /api/reset` - Reset entire database (body: `{ confirm: true }`)
- `POST /api/reset-class` - Reset class schedule (body: `{ classId, confirm: true }`)

### System
- `GET /api/health` - Health check endpoint
- `GET /api/ping` - Ping endpoint
- `GET /api/docs` - API documentation (JSON)
- `GET /api/docs/ui` - Swagger UI
- `GET /api/openapi.json` - OpenAPI specification

## 💻 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server (frontend) - Port 5174
npm run start:server     # Start Express backend - Port 4000
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
node test-api.mjs       # Run E2E API tests
```

### Development Ports
- **Frontend**: http://localhost:5174 (Vite dev server)
- **Backend**: http://localhost:4000 (Express API)
- **API Docs**: http://localhost:4000/api/docs/ui (Swagger UI)

### Database Management

The app uses file-based JSON storage in the `data/` directory:

```bash
# Files are automatically created on first run
data/classes.json       # Class definitions
data/slots.json        # Time slots
data/bookings.json     # Bookings
data/config.json       # App configuration

# Reset entire database via API
curl -X POST http://localhost:4000/api/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'

# Reset specific class schedule
curl -X POST http://localhost:4000/api/reset-class \
  -H "Content-Type: application/json" \
  -d '{"classId": "class-id", "confirm": true}'
```

### Adding a New Language

1. **Create translation file** in `src/translations/`:
   ```typescript
   // src/translations/es.ts
   export default {
     'app.title': 'Citas',
     'nav.home': 'Inicio',
     // ... add all 57 translation keys
   }
   ```

2. **Register language** in `src/i18n.tsx`:
   ```typescript
   const languages = [
     { code: 'fr', name: 'Français', flag: '🇫🇷' },
     { code: 'en', name: 'English', flag: '🇬🇧' },
     { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
     { code: 'es', name: 'Español', flag: '🇪🇸' }, // Add here
   ]
   ```

3. **Import translations** in `src/i18n.tsx`:
   ```typescript
   import esTranslations from './translations/es'
   // Add to messages object
   ```

### Common Development Tasks

#### Create a New Class
```bash
curl -X POST http://localhost:4000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yoga Class",
    "color": "#8B5CF6",
    "description": "Morning yoga sessions"
  }'
```

#### Create Time Slots for a Class
```bash
curl -X POST http://localhost:4000/api/slots/timeframe \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2025-10-20T09:00:00Z",
    "end": "2025-10-20T12:00:00Z",
    "classId": "class-id-here"
  }'
```

#### Book an Appointment
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "slot-id-here",
    "childName": "Emma Smith"
  }'
```

### Testing the Application

Run the E2E test suite:
```bash
node test-api.mjs
```

This tests:
- ✅ Server connectivity
- ✅ Configuration management
- ✅ Class creation and deletion
- ✅ Slot creation and deletion
- ✅ Booking creation and cancellation
- ✅ ICS file generation
- ✅ Database reset functionality

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000                           # Backend server port
NODE_ENV=development                # Environment (development/production)

# Database
DATA_DIR=./data                     # Directory for JSON database files

# Application
BASE_URL=http://localhost:5174      # Frontend URL (for ICS files)
VITE_API_URL=                       # API URL (empty for same-origin in dev)

# CORS (optional)
CORS_ORIGIN=http://localhost:5174   # Allowed CORS origin
```

### Application Configuration

The appointment duration can be configured via:
1. **Admin UI**: Select from 10, 15, 20, or 30 minutes
2. **API**: `PUT /api/config` with `{ rdvDurationMinutes: 15 }`
3. **Direct Edit**: Modify `data/config.json`

### Vite Configuration

Key settings in `vite.config.ts`:
- **Dev Server Port**: 5174
- **API Proxy**: `/api` → `http://localhost:4000`
- **Build Output**: `dist/`
- **Public Path**: `/`

### Tailwind Configuration

Custom theme in `tailwind.config.cjs`:
- **Colors**: Purple/gray dark theme
- **Fonts**: System font stack
- **Breakpoints**: Standard responsive breakpoints

## Deployment

The application can be deployed in several ways depending on your needs:

### Option 1: Platform as a Service (Recommended for quick setup)

#### Deploying to Railway
1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Configure environment variables:
   ```
   DATABASE_URL=postgresql://... (Railway will provide this)
   PORT=4000
   BASE_URL=https://your-app-url
   ```
4. Deploy will automatically trigger on push to main

#### Deploying to Heroku
1. Install Heroku CLI: `brew install heroku`
2. Login: `heroku login`
3. Create app: `heroku create rdvapp-production`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Configure environment:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set BASE_URL=$(heroku info -s | grep web_url | cut -d= -f2)
   ```
6. Deploy: `git push heroku main`

### Option 2: Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t rdvapp .
   ```

2. Run with Docker Compose:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "4000:4000"
       environment:
         - DATABASE_URL=postgresql://db:5432/rdvapp
         - BASE_URL=http://localhost:4000
       depends_on:
         - db
     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=rdvapp
         - POSTGRES_PASSWORD=yourpassword
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional VPS Deployment

1. Prepare the server:
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. Clone and setup:
   ```bash
   git clone https://github.com/kvaksin/rdvapp.git
   cd rdvapp
   npm install
   npm run build
   ```

3. Configure PM2:
   ```bash
   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'rdvapp',
       script: 'server/index.js',
       env: {
         NODE_ENV: 'production',
         DATABASE_URL: 'file:../prisma/production.db',
         PORT: 4000,
         BASE_URL: 'https://your-domain.com'
       }
     }]
   }
   ```

4. Start the application:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. Setup Nginx reverse proxy:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:4000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

### Production Setup

1. **Environment Configuration**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Configure production values
   nano .env.production
   ```

2. **Database Setup**
   ```bash
   # Initialize PostgreSQL
   docker run -d --name rdvapp-db \
     -e POSTGRES_DB=rdvapp \
     -e POSTGRES_USER=rdvapp \
     -e POSTGRES_PASSWORD=your-password \
     -v pgdata:/var/lib/postgresql/data \
     postgres:14
   
   # Run migrations
   DATABASE_URL=postgresql://rdvapp:your-password@localhost:5432/rdvapp \
   npx prisma migrate deploy
   ```

3. **SSL Certificate**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Generate certificate
   sudo certbot --nginx -d your-domain.com
   ```

4. **Application Deployment**

   a. Using Render.com (Recommended):
   ```bash
   # Deploy to Render.com
   git push origin main
   ```
   The application will automatically deploy when changes are pushed to the main branch.
   You can also deploy manually from the Render dashboard.

   b. Using Docker:
   ```bash
   # Deploy with Docker
   ./scripts/deploy-docker.sh
   ```

   c. Using PM2:
   ```bash
   # Deploy with PM2
   ./scripts/deploy.sh
   ```

### Monitoring Setup

1. **Logging Configuration**
   ```bash
   # Create logs directory
   mkdir -p logs
   
   # Set permissions
   chmod 755 logs
   ```

2. **Prometheus Setup**
   ```bash
   # Install Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvf prometheus-2.45.0.linux-amd64.tar.gz
   
   # Copy configuration
   sudo cp monitoring/prometheus.yml /etc/prometheus/
   
   # Start Prometheus
   sudo systemctl start prometheus
   ```

3. **Grafana Setup**
   ```bash
   # Install Grafana
   sudo apt-get install -y apt-transport-https
   sudo apt-get install -y software-properties-common wget
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
   sudo apt-get update
   sudo apt-get install grafana
   
   # Import dashboard
   curl -X POST -H "Content-Type: application/json" -d @monitoring/grafana-dashboard.json \
     http://admin:admin@localhost:3000/api/dashboards/db
   ```

4. **Metrics and Alerts**
   - Access metrics: `http://your-domain.com/metrics`
   - Grafana dashboard: `http://your-domain.com:3000`
   - Prometheus: `http://your-domain.com:9090`

### Health Monitoring

1. **Application Health**
   - Endpoint: `/api/health`
   - Metrics: `/metrics`
   - Logs: `logs/application-*.log`

2. **Key Metrics**
   - Active bookings
   - API response times
   - Database query latency
   - Error rates
   - Resource usage

3. **Alert Configuration**
   - High error rate: > 5% of requests
   - API latency: > 500ms
   - Database latency: > 200ms
   - CPU usage: > 80%
   - Memory usage: > 90%

### Backup Strategy

1. **Database Backups**
   ```bash
   # Daily backup script
   ./scripts/backup-db.sh
   
   # Configure cron job
   0 0 * * * /path/to/rdvapp/scripts/backup-db.sh
   ```

2. **Log Rotation**
   - Logs are automatically rotated daily
   - Kept for 14 days
   - Compressed after rotation

### Security Measures

1. **Application Security**
   - Rate limiting: 100 requests/min per IP
   - CORS: Configured for specific domains
   - HTTPS: Enforced with HSTS
   - Security headers: CSP, XSS protection

2. **Infrastructure Security**
   - Firewall rules
   - Regular security updates
   - Access logging
   - Fail2ban configuration

### Performance Optimization

1. **Caching Strategy**
   - Static assets: 30 days
   - API responses: Varies by endpoint
   - Database queries: Redis cache

2. **CDN Configuration**
   - Static assets served via CDN
   - Cache invalidation on deploy
   - Geographic distribution

## 🎯 Usage Guide

### For Administrators

1. **Access Admin Dashboard**: Navigate to `/admin` or click "Admin" in navigation

2. **User Management**:
   - **Approve New Users**: Navigate to "User Approval" to review pending registrations
   - **Class Lead Restrictions**: Only administrators can approve class lead users
   - **Bulk User Deletion**: Select multiple users with checkboxes and delete in bulk
   - **View Class Assignment Requests**: Review and approve/reject class assignment change requests

3. **Create a Class**:
   - Enter class name (e.g., "Kindergarten A")
   - Choose a color (click the color picker)
   - Click "Add Class"
   - Copy the generated class schedule URL to share with parents

3. **Create Time Slots**:
   - Select a class from the dropdown at the top
   - Choose a date using the date picker
   - Set start and end times (use arrow buttons or type)
   - Click "Create Slots" - the system creates slots based on configured duration

4. **Manage Slots**:
   - View all slots for the selected class
   - Each slot shows date, time, and class name
   - Delete individual slots if needed
   - Reset entire class schedule using "Reset Slots for Selected Class" button

5. **Configure Settings**:
   - Set appointment duration (10, 15, 20, or 30 minutes)
   - Changes apply to newly created slots

### For Class Leads

1. **Access Limited Admin Functions**:
   - Navigate to `/admin` for appointment creation and slot management
   - Only see classes you are assigned to
   - Can approve parent users but not other class leads

2. **Manage Class Appointments**:
   - Create time slots for your assigned classes
   - View and manage bookings for your classes
   - Reset schedules for your classes only

3. **Request Class Assignment Changes**:
   - Navigate to "Request Class Assignment" in the navigation
   - Submit requests to be assigned to different classes
   - Track status of your requests

### For Parents/Users

1. **Access Class Schedule**:
   - Use the class-specific URL provided by admin
   - Format: `/class/{classId}/{token}`

2. **Book an Appointment**:
   - View available time slots (shown in green)
   - Click "Book" on desired slot
   - Enter child's name in the modal
   - Click "Book" to confirm
   - Booked slots show "Booked — [Child Name]"

3. **Download Calendar Event**:
   - For booked appointments, click "Add to Calendar"
   - Downloads `.ics` file compatible with:
     - Google Calendar
     - Apple Calendar
     - Microsoft Outlook
     - Any RFC 5545 compliant calendar app

4. **Delete a Booking**:
   - For booked appointments, click the red "Delete" button
   - Confirm deletion in the dialog
   - The slot immediately becomes available again
   - All data is removed and cannot be recovered

5. **Change Language**:
   - Click language selector in navigation
   - Choose from French (🇫🇷), English (🇬🇧), or Dutch (🇳🇱)
   - Language preference is saved in browser

6. **Request Class Assignment Changes**:
   - Navigate to "Request Class Assignment" in the navigation
   - Select desired class and provide child's name
   - Add optional reason for the change request
   - Track status of your requests (pending/approved/rejected)
   - View your current class assignment

## 🔧 Troubleshooting

### Common Issues

**Problem**: Frontend can't connect to backend
```bash
# Solution: Check if backend is running
npm run start:server

# Verify backend is accessible
curl http://localhost:4000/api/ping
```

**Problem**: Slots not showing after creation
```bash
# Solution: Check browser console for errors
# Verify slots were created
curl http://localhost:4000/api/slots

# Clear browser cache and reload
```

**Problem**: Double-booking occurring
```bash
# Solution: This should not happen due to server-side validation
# Check data/slots.json and data/bookings.json for inconsistencies
# Reset if needed: POST /api/reset with {"confirm": true}
```

**Problem**: ICS file download not working
```bash
# Solution: Check backend logs
# Verify booking exists
curl http://localhost:4000/api/bookings

# Try accessing ICS URL directly
curl http://localhost:4000/api/bookings/{booking-id}/ics
```

**Problem**: Language not persisting
```bash
# Solution: Check browser localStorage
# Open DevTools > Application > Local Storage
# Look for 'language' key

# Clear if corrupted
localStorage.removeItem('language')
```

### Debug Mode

Enable debug logging:
```bash
# Start backend with debug output
DEBUG=express:* npm run start:server

# Or set in .env
DEBUG=express:*
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rdvapp.git
   cd rdvapp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add translations for new UI text
   - Update types if modifying API
   - Test thoroughly

4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure all checks pass

### Development Guidelines

- **Code Style**: Follow existing TypeScript/React patterns
- **Translations**: Add keys to all language files (fr, en, nl)
- **Types**: Maintain type safety, update `src/types/api.ts` as needed
- **API**: Document new endpoints in `openapi.yaml`
- **Testing**: Run `node test-api.mjs` before submitting PR

### Branch Protection Rules

The `main` branch is protected:

- ✅ Pull Request required (no direct pushes)
- ✅ At least 1 reviewer approval needed
- ✅ All status checks must pass
- ✅ Branches must be up-to-date
- ✅ Conversations must be resolved
- ✅ Rules apply to administrators

## 📝 Changelog

### Recent Updates

**October 2025 - Latest**
- ✨ **NEW**: Smart notification navigation - clicking notifications opens relevant action pages
- ✨ **NEW**: Enhanced notification system with actionable vs informational indicators
- ✨ **NEW**: Complete user management system with role-based authentication
- ✨ **NEW**: User registration and approval workflow (admin approval for class leads)
- ✨ **NEW**: Bulk user deletion functionality with checkbox selection
- ✨ **NEW**: Class assignment request system for parents and class leads
- ✨ **NEW**: Admin dashboard for managing class assignment requests
- ✨ **NEW**: Comprehensive notification system for user actions
- ✨ **NEW**: Role-based navigation and page access control
- ✨ **NEW**: Delete booking functionality with confirmation dialogs
- ✨ **NEW**: Automatic slot release when bookings are deleted
- ✨ Added complete i18n support (French, English, Dutch - 61+ translation keys)
- ✨ Implemented class-based appointment system
- ✨ Added ICS calendar export for bookings
- ✨ Per-class schedule URLs and management
- ✨ Child name tracking on bookings
- ✨ Updated Render.com deployment configuration (persistent storage, port 10000)
- 🐛 Fixed slot duplication issues
- 🐛 Improved error handling and user feedback
- 🎨 Enhanced UI with better visual feedback and delete buttons
- 🔒 Implemented comprehensive security measures and audit logging
- 📚 Updated documentation with comprehensive guides and new API endpoints

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
