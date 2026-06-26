---
description: Matcha React Native coding standards and patterns
globs: ["**/*.{tsx,jsx}"]
alwaysApply: false
---

# React Native Standards

## Hooks over Classes
```tsx
// ❌ Bad — class component
class Profile extends React.Component { ... }
// ✅ Good — function + hooks
function Profile() {
  const [user, setUser] = useState<User | null>(null);
  return <View>{user?.name}</View>;
}
```

## Performance
```tsx
// ✅ Memoize
const Item = React.memo(function Item({ data }: { data: Item }) { ... });
// ✅ FlatList over .map()
<FlatList data={items} renderItem={renderItem} />
```

## Platform-Specific
```tsx
import { Platform } from "react-native";
const padding = Platform.OS === "ios" ? 16 : 8;
```

# React Native Patterns
- Zustand for global, useState for local
- Navigation: React Navigation
- Testing: Jest + React Native Testing Library

# 🔎 Reuse check
Before adding npm dep: search package.json + existing components/
