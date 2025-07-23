# 🛠️ Theme System - Developer Guide

## Overview
This document provides technical documentation for developers who want to work with, extend, or modify the Aether theme system. The theme system is designed to be modular, extensible, and easy to integrate with both UI components and 3D scene elements.

---

## 📋 Table of Contents
1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Theme Structure](#theme-structure)
4. [Integration Guide](#integration-guide)
5. [Extending the System](#extending-the-system)
6. [Best Practices](#best-practices)
7. [API Reference](#api-reference)

---

## 🏗️ Architecture

The theme system follows a centralized state management pattern with the following key principles:

- **Single Source of Truth**: All theme data is stored in the `ThemeStore`
- **Reactive Updates**: Components subscribe to theme changes
- **Persistence**: Theme settings are automatically saved to localStorage
- **Serialization**: Themes can be exported and imported as JSON

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ThemeStore │────▶│  Listeners  │────▶│ Components  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│ LocalStorage│                         │  CSS Vars   │
└─────────────┘                         └─────────────┘
                                              │
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   3D Scene  │
                                        └─────────────┘
```

---

## 🧩 Core Components

### ThemeStore (`src/js/theme/ThemeStore.js`)
The central state management system for theme data. It handles:
- Loading and saving themes
- Updating theme properties
- Notifying subscribers of changes
- Import/export functionality

```javascript
// Example usage
import themeStore from './theme/ThemeStore';

// Get current theme
const theme = themeStore.getCurrentTheme();

// Update a color
themeStore.updateColor('ui', 'background', '#000000');

// Subscribe to changes
const unsubscribe = themeStore.subscribe(theme => {
  console.log('Theme updated:', theme);
});
```

### ThemeUpdater (`src/js/theme/ThemeUpdater.js`)
Handles updating 3D scene materials with theme colors. It:
- Subscribes to the ThemeStore
- Updates material colors when the theme changes
- Handles different scene types (main, specs, etc.)

### ColorPicker (`src/js/theme/ColorPicker.js`)
A reusable UI component for selecting colors. Features:
- Color swatch preview
- Color input with hex support
- Change event callbacks

### SettingsPage (`src/js/theme/SettingsPage.js`)
The main UI for theme customization. It provides:
- Preset theme selection
- Color pickers for all theme properties
- Import/export functionality
- Theme reset option

---

## 📊 Theme Structure

Themes are structured as JSON objects with the following format:

```javascript
{
  "name": "Theme Name",
  "version": "1.0",
  "ui": {
    // UI colors
    "background": "#050D15",
    "text": "#ffffff",
    "brand": "#050D15",
    "lightBlue": "#EEF6FF",
    "menuBackground": "#7f1d1d",
    "menuBorder": "#991b1b",
    "menuText": "#ffffff",
    "buttonBackground": "#7f1d1d",
    "buttonHover": "#991b1b",
    "buttonText": "#ffffff",
    "inputBackground": "#7f1d1d",
    "inputBorder": "#991b1b",
    "inputText": "#ffffff",
    "inputPlaceholder": "#fca5a5",
    "accent": "#41a5ff",
    "accentLight": "#abd7ff",
    "highlight": "#8affff"
  },
  "3d": {
    // 3D scene colors
    "sceneBackground": "#133153",
    "fresnelColor": "#60b2ff",
    "envColor": "#182d3d",
    "coreColor": "#bec0fe",
    "tubeColor": "#b2e0ff",
    "touchpadBaseColor": "#b4dee7",
    "touchpadCornersColor": "#8bccda",
    "touchpadVisualizerColor": "#60b2ff"
  }
}
```

### UI Colors
UI colors are applied as CSS variables with the prefix `--color-`. For example, `ui.background` becomes `--color-background`.

### 3D Colors
3D colors are applied to materials in the 3D scene through the ThemeUpdater. Each color corresponds to a specific material property or uniform.

---

## 🔌 Integration Guide

### Adding Theme Support to UI Components

1. Use CSS variables for all color properties:

```css
.my-component {
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-accent);
}
```

2. For dynamic components, access theme colors through the ThemeStore:

```javascript
import themeStore from './theme/ThemeStore';

function MyComponent() {
  const theme = themeStore.getCurrentTheme();
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeStore.subscribe(() => {
      // Update component when theme changes
      forceUpdate();
    });
    
    return unsubscribe;
  }, []);
  
  // Use theme colors
  const backgroundColor = theme.ui.background;
}
```

### Adding Theme Support to 3D Materials

1. Use uniforms for color properties in materials:

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0xff0000) },
    // Other uniforms...
  },
  // Shader code...
});

// Store reference to material for ThemeUpdater
scene.myMaterial = material;
```

2. Update the ThemeUpdater to handle your new material:

```javascript
// In ThemeUpdater.js
updateMyCustomMaterial() {
  const scenes = [
    this.gl.world.scenes.mainA,
    // Other scenes...
  ];
  
  scenes.forEach(scene => {
    if (scene && scene.myMaterial) {
      scene.myMaterial.uniforms.uColor.value = new THREE.Color(this.colors.myCustomColor);
    }
  });
}

// Add to updateMaterialColors()
updateMaterialColors() {
  // Existing code...
  this.updateMyCustomMaterial();
}
```

3. Add the new color to the theme structure in `ThemeStore.js`:

```javascript
export const defaultTheme = {
  // Existing theme properties...
  "3d": {
    // Existing 3D colors...
    "myCustomColor": "#ff0000"
  }
};
```

---

## 🧠 Extending the System

### Adding New Theme Properties

1. Add the property to the default theme and preset themes in `ThemeStore.js`
2. Update the UI components to use the new property
3. If it's a 3D property, update the ThemeUpdater to apply it

### Creating New Preset Themes

Add a new theme object to `ThemeStore.js`:

```javascript
export const myNewTheme = {
  name: "My Theme",
  version: "1.0",
  ui: {
    // UI colors...
  },
  "3d": {
    // 3D colors...
  }
};

// Add to presetThemes array
export const themeStore = createThemeStore(defaultTheme, [
  darkTheme, 
  lightTheme, 
  neonTheme,
  myNewTheme
]);
```

### Adding Custom Theme Components

You can create custom UI components for theme selection or preview:

```javascript
import themeStore from './theme/ThemeStore';

function ThemePreview({ themeName }) {
  const themes = themeStore.getAvailableThemes();
  const theme = themes.find(t => t.name === themeName);
  
  if (!theme) return null;
  
  return (
    <div className="theme-preview" onClick={() => themeStore.setTheme(theme)}>
      <div className="theme-preview__name">{theme.name}</div>
      <div 
        className="theme-preview__color" 
        style={{ backgroundColor: theme.ui.background }}
      />
      <div 
        className="theme-preview__accent" 
        style={{ backgroundColor: theme.ui.accent }}
      />
    </div>
  );
}
```

---

## 📝 Best Practices

### Performance Optimization

- **Batch Updates**: When changing multiple colors, batch the updates to minimize DOM operations
- **Memoize Components**: Use memoization to prevent unnecessary re-renders
- **Debounce Changes**: For color pickers, debounce the onChange event

### Theme Design

- **Consistent Naming**: Use consistent naming conventions for color properties
- **Semantic Colors**: Name colors based on their purpose, not their appearance
- **Color Relationships**: Maintain proper contrast ratios between text and background colors
- **Accessibility**: Ensure all color combinations meet WCAG accessibility guidelines

### Code Organization

- **Separate Concerns**: Keep theme logic separate from component logic
- **Avoid Direct References**: Components should access theme colors through the ThemeStore
- **Document Color Usage**: Comment on why specific colors are used for specific elements

---

## 📚 API Reference

### ThemeStore

```typescript
interface ThemeStore {
  getCurrentTheme(): Theme;
  getAvailableThemes(): Theme[];
  setTheme(theme: Theme): void;
  updateColor(path: 'ui' | '3d', colorKey: string, value: string): void;
  resetToDefault(): void;
  exportTheme(): void;
  importTheme(jsonString: string): boolean;
  subscribe(callback: (theme: Theme) => void): () => void;
  get3DColors(): ThreeDColors;
}

interface Theme {
  name: string;
  version: string;
  ui: UIColors;
  '3d': ThreeDColors;
}

interface UIColors {
  background: string;
  text: string;
  // Other UI colors...
}

interface ThreeDColors {
  sceneBackground: string;
  fresnelColor: string;
  // Other 3D colors...
}
```

### ColorPicker

```typescript
interface ColorPickerOptions {
  container: HTMLElement;
  initialColor: string;
  label: string;
  onChange: (color: string) => void;
}

interface ColorPicker {
  constructor(options: ColorPickerOptions);
  setColor(color: string): void;
  getColor(): string;
  destroy(): void;
}
```

### ThemeUpdater

```typescript
interface ThemeUpdater {
  handleThemeChange(theme: Theme): void;
  updateSceneColors(): void;
  updateSceneBackground(): void;
  updateMaterialColors(): void;
  updateMainSceneMaterials(): void;
  updateSpecsSceneMaterials(): void;
  updateFWASceneMaterials(): void;
  dispose(): void;
}
```

---

## 🔄 Migration Guide

If you're migrating from an older version of the theme system:

1. Update all color references to use CSS variables
2. Replace direct material color assignments with ThemeUpdater subscriptions
3. Update any custom themes to match the new theme structure

---

*For user documentation on using the theme system, please refer to the [Theme Customization Guide](./THEME_CUSTOMIZATION_GUIDE.md).* 