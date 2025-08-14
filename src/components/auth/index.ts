// Authentication Provider and Context
export { 
  AuthProvider, 
  useAuth, 
  useCurrentUser, 
  useIsAuthenticated, 
  usePermissions 
} from './AuthProvider';

// Route Protection Components
export {
  ProtectedRoute,
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  SuperAdminGuard,
  ConditionalRender,
  ConditionalRoleRender,
  ConditionalPermissionRender,
} from './ProtectedRouteNew';

// Loading Components
export {
  LoadingSpinner,
  LoadingOverlay,
  InlineLoading,
  ButtonLoading,
} from './LoadingSpinner';

// Unauthorized Access Components
export {
  UnauthorizedAccess,
  UnauthorizedMessage,
  UnauthorizedBanner,
} from './UnauthorizedAccess';

// Error Boundary Components
export {
  AuthErrorBoundary,
  AuthErrorBoundaryWrapper,
  SimpleErrorFallback,
  NetworkErrorFallback,
} from './ErrorBoundary';

// Legacy components (for backward compatibility)
export { AuthGuard } from './AuthGuard';
export { UserMenu } from './UserMenu';