# Mobile Responsive Testing Checklist

## Performance Targets

### Lighthouse Scores (Mobile)
- [ ] Performance: >80
- [ ] Accessibility: >90
- [ ] Best Practices: >90
- [ ] SEO: >90
- [ ] PWA: 100

### Load Time Targets
- [ ] First Contentful Paint: <2s
- [ ] Time to Interactive: <3.5s
- [ ] Largest Contentful Paint: <2.5s
- [ ] Cumulative Layout Shift: <0.1
- [ ] Total Blocking Time: <300ms

### Bundle Size
- [ ] Main bundle: <500KB gzipped
- [ ] Vendor chunks properly split
- [ ] Images optimized (WebP where possible)
- [ ] Lazy loading implemented for routes

## Mobile Device Testing

### iOS Devices
- [ ] iPhone SE (375x667) - Safari
- [ ] iPhone 12/13 (390x844) - Safari
- [ ] iPhone 14 Pro Max (430x932) - Safari
- [ ] iPad (810x1080) - Safari
- [ ] Safe area insets work correctly
- [ ] Status bar doesn't overlap content
- [ ] PWA install works
- [ ] Add to Home Screen works

### Android Devices
- [ ] Galaxy S10+ (412x869) - Chrome
- [ ] Pixel 5 (393x851) - Chrome
- [ ] OnePlus 9 (412x915) - Chrome
- [ ] Samsung Galaxy Tab (800x1280) - Chrome
- [ ] PWA install works
- [ ] Add to Home Screen works

### Other Browsers
- [ ] Firefox Mobile
- [ ] Samsung Internet
- [ ] Opera Mobile

## Touch Targets

### Minimum Size Requirements
- [ ] All buttons: ≥44px height
- [ ] Navigation items: ≥48px height
- [ ] Input fields: ≥44px height
- [ ] Clickable icons: ≥44px tap area
- [ ] Bottom nav items: ≥60px height

### Specific Components
- [ ] Button component (sm, md, lg variants)
- [ ] Bottom navigation bar
- [ ] Header navigation
- [ ] Feature cards on home page
- [ ] Voice input button
- [ ] Camera capture button
- [ ] Form submit buttons
- [ ] Scheme cards
- [ ] Market price cards

## Layout & Responsiveness

### No Horizontal Scrolling
- [ ] Home page
- [ ] Disease detection page
- [ ] Market prices page
- [ ] Advisory page
- [ ] Schemes page
- [ ] Profile page
- [ ] Login/Onboarding pages

### Proper Spacing
- [ ] Consistent padding/margins across pages
- [ ] Cards don't touch screen edges
- [ ] Text has proper line height
- [ ] Sections have clear separation
- [ ] Bottom navigation doesn't overlap content

### Typography
- [ ] Font sizes readable on small screens
- [ ] No text overflow/truncation issues
- [ ] Line lengths appropriate for reading
- [ ] Headings have proper hierarchy
- [ ] Multi-language text renders correctly

## Functionality Testing

### Camera Functionality
- [ ] Camera permission prompt appears
- [ ] Camera stream displays correctly
- [ ] Capture button works
- [ ] Photo upload from gallery works
- [ ] Preview shows before submission
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Handles camera errors gracefully

### Microphone Functionality
- [ ] Microphone permission prompt appears
- [ ] Recording indicator shows
- [ ] Audio is captured correctly
- [ ] Stop recording works
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Handles microphone errors gracefully

### Forms
- [ ] Input fields work with on-screen keyboard
- [ ] Keyboard doesn't hide input fields
- [ ] Auto-complete works where applicable
- [ ] Form validation messages display correctly
- [ ] Submit buttons accessible when keyboard open

### Gestures
- [ ] Swipe gestures work (if applicable)
- [ ] Pull-to-refresh disabled on pages with scrollable content
- [ ] Pinch-to-zoom disabled on app (except images)
- [ ] Overscroll behavior controlled

## Performance Features

### Code Splitting
- [ ] Routes lazy loaded
- [ ] Vendor chunks separated
- [ ] Dynamic imports for heavy components
- [ ] Bundle analyzer shows proper split

### Image Optimization
- [ ] Images lazy loaded
- [ ] Proper image sizes for different screens
- [ ] WebP format used where supported
- [ ] Placeholder/skeleton while loading

### Caching
- [ ] Service worker registered
- [ ] Static assets cached
- [ ] API responses cached appropriately
- [ ] Cache invalidation works
- [ ] Offline fallback page available

### Animations
- [ ] Smooth 60fps animations
- [ ] No janky scrolling
- [ ] Transitions feel responsive
- [ ] Loading states show immediately
- [ ] No layout shift during animations

## Offline Functionality

### PWA Features
- [ ] App installable
- [ ] Works offline (cached pages)
- [ ] Offline banner shows when disconnected
- [ ] Syncs when connection restored
- [ ] App manifest correct

### Offline Behavior
- [ ] Previously viewed pages load offline
- [ ] Cached data displays
- [ ] Error messages clear when offline
- [ ] No infinite loading states
- [ ] Queue actions for when online

## Accessibility

### Screen Reader
- [ ] VoiceOver (iOS) navigation works
- [ ] TalkBack (Android) navigation works
- [ ] All images have alt text
- [ ] Buttons have proper labels
- [ ] Form inputs have labels

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] All interactive elements reachable
- [ ] Escape key closes modals
- [ ] Enter key submits forms

### Color & Contrast
- [ ] Text contrast ratio ≥4.5:1
- [ ] Color not sole indicator
- [ ] Focus states visible
- [ ] Error states clear

## Network Conditions

### Slow 3G
- [ ] App loads in reasonable time
- [ ] Loading states show
- [ ] Images load progressively
- [ ] Timeout handling works
- [ ] Retry mechanism available

### Fast 3G
- [ ] App loads quickly
- [ ] Smooth navigation
- [ ] Images load without delay

### 4G/WiFi
- [ ] Optimal performance
- [ ] All features work instantly

## Browser-Specific Issues

### Safari (iOS)
- [ ] No white flash on navigation
- [ ] Viewport height handles correctly
- [ ] Position fixed works
- [ ] Smooth scrolling works
- [ ] Camera/mic permissions work

### Chrome (Android)
- [ ] Address bar hide/show doesn't break layout
- [ ] Pull-to-refresh controlled
- [ ] Bottom bar doesn't overlap content
- [ ] PWA install banner shows

## Final Checks

### Pre-Demo
- [ ] Build succeeds with no errors
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no errors
- [ ] All routes accessible
- [ ] No console errors on any page
- [ ] All images load correctly
- [ ] All icons display correctly
- [ ] Translations work in all languages

### User Journey
- [ ] Complete signup flow works
- [ ] Onboarding completes successfully
- [ ] Voice query works end-to-end
- [ ] Disease detection works end-to-end
- [ ] Market prices load and display
- [ ] Advisory recommendations load
- [ ] Schemes display and are clickable
- [ ] Profile edit saves correctly
- [ ] Logout works

## Performance Optimization Checklist

### Completed Optimizations
- [x] Code splitting implemented (vendor chunks)
- [x] Route-based lazy loading
- [x] Minification and compression (Terser)
- [x] Tree shaking enabled
- [x] CSS minification
- [x] Image optimization guidelines in place
- [x] Service worker caching configured
- [x] API response caching (Redis)
- [x] Gzip compression
- [x] Preconnect to API domain
- [x] DNS prefetch
- [x] Touch target minimum sizes enforced
- [x] Smooth animations (CSS transitions)
- [x] Loading skeletons implemented
- [x] Safe area insets (iOS notch support)
- [x] Overscroll behavior controlled
- [x] No horizontal scroll prevention

### Scripts Available
```bash
# Build and test production bundle
pnpm run build

# Test with preview server
pnpm run preview

# Run Lighthouse mobile audit
pnpm run lighthouse:mobile

# Run Lighthouse desktop audit  
pnpm run lighthouse

# Analyze bundle size
pnpm run analyze

# Check TypeScript
pnpm run typecheck

# Lint code
pnpm run lint
```

## Notes
- All touch targets are minimum 44px (WCAG 2.1 Level AAA)
- Bottom nav items are 60px for better ergonomics
- Safe area insets ensure proper display on notched devices
- Animations are smooth and performant (GPU accelerated)
- Code splitting reduces initial bundle size significantly
- PWA features ensure offline capability
