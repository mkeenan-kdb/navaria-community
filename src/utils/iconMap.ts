import * as LucideIcons from 'lucide-react-native';

// Generate icon list dynamically
export const allIcons = Object.keys(LucideIcons)
  .filter(
    key =>
      key !== 'createLucideIcon' && key !== 'default' && /^[A-Z]/.test(key),
  )
  .map(key => ({
    name: key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    icon: (LucideIcons as any)[key] as LucideIcons.LucideIcon,
    pascalName: key,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Generate efficient lookup map
export const iconMap = allIcons.reduce(
  (acc, item) => {
    acc[item.name] = item.icon;
    return acc;
  },
  {} as Record<string, LucideIcons.LucideIcon>,
);

// Robust getter function
export const getIconComponent = (
  iconName: string | null | undefined,
): LucideIcons.LucideIcon => {
  if (!iconName) {
    return LucideIcons.GraduationCap;
  }

  // 1. Try exact match (kebab-case)
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

  // 2. Try removing '-icon' suffix (common confusion or legacy format)
  const nameWithoutSuffix = iconName.replace(/-icon$/, '');
  if (iconMap[nameWithoutSuffix]) {
    return iconMap[nameWithoutSuffix];
  }

  // 3. Try removing 'icon-' prefix? Unlikely but possible.

  // 4. Try direct PascalCase lookup (if stored that way manually)
  if ((LucideIcons as any)[iconName]) {
    return (LucideIcons as any)[iconName];
  }

  // 5. Try converting to PascalCase?
  // e.g. activity-square -> ActivitySquare
  // This is complex to perfect but we can try basic:
  const parts = iconName.split(/[-_]/);
  const pascalName = parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
  if ((LucideIcons as any)[pascalName]) {
    return (LucideIcons as any)[pascalName];
  }

  // 6. Try searching locally with loose match
  const looseMatch = allIcons.find(
    i => i.name === iconName.toLowerCase() || i.pascalName === iconName,
  );
  if (looseMatch) {
    return looseMatch.icon;
  }

  // Fallback
  return LucideIcons.GraduationCap;
};
