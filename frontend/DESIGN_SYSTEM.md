# Ihsan Design System

## Overview

Ihsan features a modern, Islamic-inspired design with deep colors, elegant gradients, and full responsiveness across all devices.

## Color Palette

### Primary Colors

- **Primary**: `#0F4C75` (Deep Ocean Blue) - Represents depth and spirituality
- **Secondary**: `#1B998B` (Teal Green) - Symbolizes growth and renewal
- **Accent**: `#D4AF37` (Golden) - Reflects divine light and excellence
- **Dark**: `#0A1931` (Deep Navy) - Used for dark mode and depth
- **Light**: `#F0F4F8` (Soft White) - Clean, peaceful backgrounds

### Gradients

- **Islamic Gradient**: Linear gradient from primary → secondary → dark
- **Teal Gradient**: Linear gradient from secondary → primary
- **Gold Gradient**: Linear gradient using accent shades

## Typography

- **Headings**: Bold, using gradient text effects for emphasis
- **Body**: Clean, readable fonts with proper contrast
- **Responsive sizes**: Adjusted for mobile (text-sm), tablet (text-base), desktop (text-lg)

## Spacing & Layout

- **Mobile-first**: All components designed for mobile first
- **Breakpoints**:
  - sm: 640px (Small phones)
  - md: 768px (Tablets)
  - lg: 1024px (Small laptops)
  - xl: 1280px (Desktops)

## Components

### Cards

- **Base**: White/light background with subtle borders
- **Shadow**: Islamic-inspired shadows (shadow-islamic, shadow-islamic-lg)
- **Hover**: Smooth transitions with enhanced shadows
- **Border**: Subtle borders using primary color with opacity

### Buttons

- **Primary**: Gradient background (teal gradient)
- **Secondary**: Outlined with hover effects
- **Ghost**: Transparent with hover background
- **Sizes**: Responsive sizing (btn-sm, btn-md, btn-lg)

### Forms

- **Inputs**: Clean borders with focus rings in primary color
- **Labels**: Clear, accessible labels
- **Validation**: Color-coded feedback
- **Mobile**: Minimum 16px font size to prevent zoom

### Navigation

- **Navbar**: Gradient background with white text
- **Mobile**: Collapsible menu, fixed positioning
- **Desktop**: Horizontal layout with dropdowns

## Responsive Breakpoints

### iPhone SE 2020 (375px)

- Salam text moved to separate banner
- Reduced font sizes
- Stacked layouts
- Touch-optimized button sizes (44px minimum)

### Tablets (768px - 1024px)

- Two-column layouts
- Medium-sized components
- Improved spacing

### Desktop (1024px+)

- Multi-column layouts
- Full navigation visible
- Enhanced animations

## Accessibility

- **Focus States**: Clear 2px outlines in secondary color
- **Touch Targets**: Minimum 44x44px on mobile
- **Color Contrast**: WCAG AA compliant
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels

## Animations

- **Float**: Gentle floating effect for background orbs
- **Scale**: Smooth scale transitions on interactions
- **Fade**: Opacity transitions for modals
- **Gradient Shift**: Animated gradient backgrounds

## Password Visibility Toggle

All password fields include an eye icon button that toggles between:

- **Hidden**: type="password" with EyeIcon
- **Visible**: type="text" with EyeSlashIcon

## Best Practices

1. Use gradient backgrounds for hero sections
2. Apply shadow-islamic for elevated cards
3. Maintain consistent spacing (gap-4, gap-6, gap-8)
4. Use motion components from framer-motion
5. Test on iPhone SE, iPad, and desktop
6. Ensure 16px minimum font on form inputs (mobile)
7. Use semantic HTML (header, nav, main, footer)

## Dark Mode

- Automatic theme detection
- Manual toggle available
- Smooth transitions between themes
- Adjusted colors for reduced eye strain

## Performance

- Lazy loading for images
- Optimized animations
- Minimal bundle size
- Fast page transitions

## Future Enhancements

- Additional theme options (light Islamic, dark Islamic)
- More animation presets
- Component library documentation
- Storybook integration
