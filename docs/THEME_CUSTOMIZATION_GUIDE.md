# 🎨 Theme Customization Guide

## Overview
The Aether project includes a powerful theme customization system that allows you to personalize both the user interface and 3D scene colors. This guide explains how to use the theme settings page, create and save custom themes, and share themes with others.

---

## 📋 Table of Contents
1. [Accessing Theme Settings](#accessing-theme-settings)
2. [Understanding the Interface](#understanding-the-interface)
3. [Customizing Colors](#customizing-colors)
4. [Using Preset Themes](#using-preset-themes)
5. [Importing & Exporting Themes](#importing--exporting-themes)
6. [Advanced Customization](#advanced-customization)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Accessing Theme Settings

To access the theme customization interface:

1. Navigate to `/settings` in your browser
2. Or click the "Theme Settings" link in the main menu (if available)

The settings page provides a complete interface for customizing all aspects of the application's appearance.

---

## 🖥️ Understanding the Interface

The theme settings page is organized into several sections:

### Preset Themes
Pre-configured color schemes that you can apply with a single click.

### UI Colors
Colors that affect the user interface elements like buttons, text, backgrounds, and menus.

### 3D Scene Colors
Colors that affect the 3D visualization, including scene background, material colors, and lighting effects.

### Theme Actions
Buttons for importing, exporting, and resetting themes.

---

## 🎨 Customizing Colors

### Changing Individual Colors

1. Find the color you want to change in either the "UI Colors" or "3D Scene Colors" section
2. Click on the color swatch to open the color picker
3. Select a new color using the color picker
4. Alternatively, enter a hex color code (e.g., #FF5500) in the text field
5. Changes are applied immediately and saved automatically

### Color Categories Explained

#### UI Colors
- **Background**: Main application background color
- **Text**: Primary text color throughout the application
- **Brand**: Color used for branding elements
- **Light Blue**: Secondary background color for panels
- **Menu Background**: Background color for navigation menus
- **Menu Border**: Border color for menu elements
- **Button Background/Hover**: Colors for interactive buttons
- **Input Background/Border**: Colors for form elements
- **Accent/Highlight**: Colors for emphasis and interactive elements

#### 3D Scene Colors
- **Scene Background**: The background color of the 3D scene
- **Fresnel Color**: Color of edge highlights on 3D objects
- **Env Color**: Environmental lighting color
- **Core Color**: Color of the earbuds' core element
- **Tube Color**: Color of the connecting tube element
- **Touchpad Colors**: Colors for the interactive touchpad visualization

---

## 🎭 Using Preset Themes

The application includes several preset themes:

### Default
The standard theme with the original design colors.

### Dark
A dark theme with deep blues and vibrant accents.

### Light
A light theme with white backgrounds and blue accents.

### Neon
A high-contrast theme with vibrant purple and pink colors.

To apply a preset theme:
1. Click on the theme name in the "Preset Themes" section
2. The theme will be applied immediately
3. You can then make further customizations if desired

---

## 💾 Importing & Exporting Themes

### Exporting Your Theme
To save your current theme for backup or sharing:

1. Click the "Export Theme" button
2. A JSON file will be downloaded with your theme settings
3. This file contains all color values for both UI and 3D elements

### Importing a Theme
To load a previously saved theme:

1. Click the "Import Theme" button
2. Select a theme JSON file from your computer
3. If the file is valid, the theme will be applied immediately
4. If the file is invalid, you'll see an error message

### Resetting to Default
To revert all changes and return to the default theme:

1. Click the "Reset to Default" button
2. Confirm the action when prompted
3. All colors will be reset to their original values

---

## 🔧 Advanced Customization

### Theme JSON Structure
If you want to manually edit a theme file, here's the structure:

```json
{
  "name": "Custom Theme",
  "version": "1.0",
  "ui": {
    "background": "#050D15",
    "text": "#ffffff",
    // Additional UI colors...
  },
  "3d": {
    "sceneBackground": "#133153",
    "fresnelColor": "#60b2ff",
    // Additional 3D colors...
  }
}
```

### Creating Themes Programmatically
Advanced users can create themes programmatically by:

1. Exporting an existing theme as a starting point
2. Modifying the JSON structure
3. Importing the modified theme

---

## ❓ Troubleshooting

### Theme Not Saving
- Ensure your browser has local storage enabled
- Check that you have sufficient storage space
- Try using the export function to save your theme externally

### Colors Not Updating
- Refresh the page to ensure all components load the new theme
- Check the browser console for any JavaScript errors
- Try applying a preset theme and then customize from there

### Import Errors
- Ensure the theme file is valid JSON
- Check that the theme file contains both "ui" and "3d" sections
- Verify that all required color properties are present

---

## 📝 Notes

- Theme settings are saved to your browser's local storage and will persist across sessions
- Each browser/device maintains its own theme settings
- To use the same theme across devices, use the export/import functionality

---

*For developer documentation on extending the theme system, please refer to the internal development guide.* 