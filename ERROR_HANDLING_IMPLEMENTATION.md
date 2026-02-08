# Error Handling and Loading States Implementation

This document summarizes the implementation of comprehensive error handling and loading states for the Farmly AI application.

## Backend Implementation

### 1. Error Handling Middleware (`backend/src/middleware/errorHandler.middleware.ts`)

**Features:**
- **Global error handler** that catches all errors from routes and middleware
- **Mongoose error handling** with specific handlers for:
  - ValidationError (returns 400)
  - CastError (returns 400)
  - Duplicate key errors (returns 409)
- **Zod validation error handling** with detailed field-level error messages
- **Custom ApiError class** for throwing errors with specific status codes
- **Structured logging** with Winston, including request context (path, method, IP, userId)
- **Environment-aware error messages** (detailed in dev, sanitized in production)
- **404 handler** for undefined routes
- **asyncHandler utility** for wrapping async route handlers

**Integration:**
- Added to Express app after all routes in `backend/src/index.ts`
- Applies to all API endpoints automatically

### 2. Structured Logging (Winston)

**Existing implementation enhanced:**
- Logger already configured in `backend/src/utils/logger.ts`
- Error handler now logs all errors with full context
- Includes stack traces, request details, and user information

### 3. Rate Limiting

**Existing implementation:**
- `backend/src/middleware/rateLimiter.middleware.ts` already implements rate limiting
- General rate limit: 100 requests per 15 minutes
- Disease detection specific limit: 10 requests per hour

## Frontend Implementation

### 1. Toast Notifications (`sonner`)

**Installation:**
```bash
pnpm add sonner
```

**Integration:**
- Added `<Toaster />` to `App.tsx` with position="top-center", richColors, and closeButton
- Integrated into Axios interceptors for automatic error notifications

### 2. Loading Components

**LoadingSpinner** (`frontend/src/components/common/LoadingSpinner.tsx`):
- Supports multiple sizes: sm, md, lg, xl
- Optional loading text
- Full-screen overlay option
- Animated spinner using Lucide React icons

**LoadingSkeleton Components:**
- `LoadingSkeleton` - Basic skeleton with configurable className
- `CardSkeleton` - Pre-configured card skeleton
- `ListSkeleton` - Multiple card skeletons for lists

### 3. Empty State Component

**EmptyState** (`frontend/src/components/common/EmptyState.tsx`):
- Optional icon (any Lucide icon)
- Title and description
- Optional action button
- Responsive and accessible design

### 4. Error Components

**ErrorBoundary** (`frontend/src/components/common/ErrorBoundary.tsx`):
- React error boundary to catch component errors
- Shows user-friendly error UI
- Displays error details in development mode only
- Options to refresh page or try again
- Integrated into `App.tsx` wrapping the entire app

**ErrorMessage** (`frontend/src/components/common/ErrorMessage.tsx`):
- Three variants: inline, banner, card
- Optional retry and dismiss actions
- Consistent error styling across the app

### 5. Enhanced Axios Instance with Interceptors

**Updated** (`frontend/src/utils/axios.ts`):

**Request Interceptor:**
- Automatically adds JWT token from auth store to all requests
- Sets proper headers

**Response Interceptor:**
- **Automatic token refresh** with queuing mechanism to prevent multiple refresh calls
- **Comprehensive error handling:**
  - 401 Unauthorized → Attempt token refresh, logout on failure
  - 429 Too Many Requests → Toast notification
  - 403 Forbidden → Toast notification
  - 404 Not Found → Toast notification
  - 5xx Server Errors → Generic error toast
  - Network errors → Offline notification
  - Timeout errors → Connection check prompt
- **Error message extraction** from API responses
- **Queue management** for requests during token refresh

**Error Message Helper:**
- Extracts user-friendly error messages from Axios errors
- Handles various API response formats
- Provides fallback messages for network issues

### 6. Auth Store Updates

**Enhanced** (`frontend/src/store/authStore.ts`):
- Added `token` and `refreshToken` getter properties for easy access
- Updated `setTokens` method to accept separate token and optional refreshToken
- Renamed `refreshToken` method to `refreshTokens` to avoid naming conflict

## Usage Examples

### Backend: Using Error Handling

```typescript
import { ApiError, asyncHandler } from '../middleware/errorHandler.middleware.js';

// Throwing a custom error
throw new ApiError(400, 'Invalid input data');

// Using asyncHandler
router.get('/endpoint', asyncHandler(async (req, res) => {
  // Any errors thrown here will be caught automatically
  const data = await someAsyncOperation();
  res.json(data);
}));
```

### Frontend: Using Loading Components

```typescript
import { LoadingSpinner, CardSkeleton } from '../components/common/LoadingSpinner';

// Full screen loading
<LoadingSpinner size="lg" text="Loading..." fullScreen />

// Inline loading
{isLoading ? <CardSkeleton /> : <DataComponent data={data} />}
```

### Frontend: Using Empty State

```typescript
import { EmptyState } from '../components/common/EmptyState';
import { Inbox } from 'lucide-react';

<EmptyState
  icon={Inbox}
  title="No queries yet"
  description="Start by asking a question using the voice button"
  action={{
    label: "Get Started",
    onClick: () => navigate('/home')
  }}
/>
```

### Frontend: Using Error Message

```typescript
import { ErrorMessage } from '../components/common/ErrorMessage';

// Card variant with retry
<ErrorMessage
  variant="card"
  title="Failed to load data"
  message={error.message}
  onRetry={() => refetch()}
/>

// Inline variant
<ErrorMessage
  variant="inline"
  message="Invalid phone number"
/>
```

### Frontend: Manual Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Profile updated successfully');

// Error
toast.error('Failed to upload image');

// Info
toast.info('New update available');

// Loading with promise
toast.promise(
  saveData(),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Failed to save'
  }
);
```

## Verification Steps

### Backend

1. **Type checking**: ✅ `pnpm run typecheck` passes
2. **Build**: ✅ `pnpm run build` compiles successfully
3. **Linting**: ⚠️  Error handler passes, some pre-existing issues in other files

### Frontend

1. **Type checking**: ✅ `pnpm run typecheck` passes
2. **Build**: ✅ `pnpm run build` compiles successfully (847 KB main bundle)
3. **PWA**: ✅ Service worker and manifest generated

## Testing Recommendations

### Manual Testing Scenarios

**Backend:**
1. Hit a non-existent route → Verify 404 JSON response
2. Send invalid data to an endpoint → Verify validation errors returned
3. Exceed rate limit → Verify 429 response with retry message
4. Cause a server error → Verify 500 response (sanitized in production)

**Frontend:**
1. **Network Errors:**
   - Turn off WiFi → Verify offline toast appears
   - Make API call while offline → Verify error handling
2. **Loading States:**
   - Navigate to pages → Verify loading spinners appear
   - Check for layout shift during loading
3. **Error Boundary:**
   - Trigger a React error → Verify error boundary catches it
4. **Token Expiration:**
   - Wait for token to expire → Verify automatic refresh works
   - Block refresh endpoint → Verify logout on refresh failure
5. **Empty States:**
   - New user with no data → Verify empty states show correctly
6. **Toast Notifications:**
   - Trigger various API errors → Verify appropriate toasts appear
   - Check toast doesn't block important UI elements

## Performance Considerations

**Backend:**
- Error logging is async and doesn't block responses
- Rate limiting uses in-memory store (Redis would be better for production)

**Frontend:**
- Loading skeletons prevent layout shift
- Error boundary prevents full app crashes
- Axios timeout set to 30 seconds to prevent hanging requests
- Token refresh queue prevents multiple simultaneous refresh calls

## Future Enhancements

1. **Backend:**
   - Add Sentry or similar error tracking service
   - Implement error aggregation and monitoring dashboard
   - Add request ID tracking for distributed tracing

2. **Frontend:**
   - Add retry logic with exponential backoff
   - Implement optimistic updates for better UX
   - Add offline queue for mutations
   - Create reusable error recovery strategies

## Files Modified/Created

### Backend
- ✅ Created: `src/middleware/errorHandler.middleware.ts`
- ✅ Modified: `src/index.ts` (added error handlers)

### Frontend
- ✅ Created: `src/components/common/LoadingSpinner.tsx`
- ✅ Created: `src/components/common/EmptyState.tsx`
- ✅ Created: `src/components/common/ErrorBoundary.tsx`
- ✅ Created: `src/components/common/ErrorMessage.tsx`
- ✅ Modified: `src/utils/axios.ts` (enhanced with interceptors)
- ✅ Modified: `src/store/authStore.ts` (added token getters)
- ✅ Modified: `src/App.tsx` (added ErrorBoundary and Toaster)
- ✅ Installed: `sonner` package

## Conclusion

The error handling and loading states implementation provides:

✅ **Robust error handling** on both backend and frontend
✅ **User-friendly error messages** with toast notifications
✅ **Loading indicators** to improve perceived performance
✅ **Empty states** for better UX when no data exists
✅ **Error boundaries** to prevent full app crashes
✅ **Automatic token refresh** for seamless authentication
✅ **Comprehensive logging** for debugging and monitoring

All TypeScript checks pass and the application builds successfully on both frontend and backend.
