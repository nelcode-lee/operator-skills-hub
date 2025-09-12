# Operator Skills Hub - New Colour Theme

## Overview
The Operator Skills Hub now uses a new colour theme that should be applied to all future changes and updates.

## Primary Colour Palette

### Main Colours
- **Teal** - Primary brand colour
  - `teal-50` - Light backgrounds
  - `teal-100` - Subtle accents
  - `teal-600` - Icons and accents
  - `teal-700` - Primary buttons
  - `teal-800` - Headings and emphasis
  - `teal-900` - Dark backgrounds

### Secondary Colours
- **Yellow** - Call-to-action and highlights
  - `yellow-500` - Primary CTA buttons
  - `yellow-600` - Hover states
  - `yellow-400` - Star ratings

### Text Colours
- **Slate** - All text content
  - `slate-50` - Light backgrounds
  - `slate-600` - Secondary text
  - `slate-700` - Body text
  - `slate-800` - Headings and emphasis

### Supporting Colours
- **Green/Emerald** - Success states and positive elements
- **White** - Card backgrounds and contrast
- **Custom CSS Variables** - For design system consistency

## Usage Guidelines

### Buttons
- **Primary CTA**: `!bg-yellow-500 hover:!bg-yellow-600 !text-slate-800`
- **Secondary**: `!bg-teal-700 hover:!bg-teal-800 !text-white`
- **Outline**: `border-teal-700 !text-teal-700 hover:!bg-teal-50`

### Text
- **Headings**: `!text-slate-800`
- **Subheadings**: `!text-teal-800`
- **Body text**: `!text-slate-700`
- **Secondary text**: `!text-slate-600`

### Backgrounds
- **Main background**: `bg-background` (uses CSS variable)
- **Hero sections**: `bg-gradient-to-br from-slate-50 to-teal-50`
- **Card backgrounds**: `bg-white`
- **Section backgrounds**: `bg-slate-50`

### Icons and Accents
- **Primary icons**: `!text-teal-600`
- **Success/check icons**: `!text-teal-600`
- **Star ratings**: `text-yellow-400`

## Implementation Notes

1. **Always use `!important`** with colour classes to override default styles
2. **Use CSS variables** where possible for consistency
3. **Maintain contrast ratios** for accessibility
4. **Test on both light and dark modes** if applicable
5. **Follow the established pattern** from existing components

## Examples

### Hero Section
```tsx
<div className="bg-gradient-to-br from-slate-50 to-teal-50 py-20">
  <h1 className="text-4xl md:text-6xl font-bold !text-slate-800">
    Main Heading
  </h1>
  <h2 className="text-2xl md:text-3xl font-semibold !text-teal-800">
    Subheading
  </h2>
  <Button className="!bg-yellow-500 hover:!bg-yellow-600 !text-slate-800 font-bold">
    Call to Action
  </Button>
</div>
```

### Card Component
```tsx
<Card className="hover:shadow-xl transition-shadow duration-300">
  <CardContent className="p-6">
    <h3 className="text-xl font-bold !text-slate-800">Card Title</h3>
    <p className="!text-slate-600">Card description</p>
    <Button className="!bg-teal-700 hover:!bg-teal-800 !text-white">
      Action Button
    </Button>
  </CardContent>
</Card>
```

## Future Updates

**All future changes must use this new colour theme.** This ensures consistency across the entire Operator Skills Hub platform and maintains the professional, modern appearance that aligns with the brand identity.

Last Updated: [Current Date]


