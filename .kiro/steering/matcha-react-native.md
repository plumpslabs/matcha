---
description: Matcha React Native coding standards and patterns
inclusion: fileMatch
fileMatchPattern: "*.tsx|*.jsx"
---

# React Native Standards

## Hooks over Classes
```
// ❌ Bad — class component
class Profile extends React.Component { ... }
// ✅ Good — function + hooks
function Profile() {
  const [user, setUser] = useState<User | null>(null);
  return <View>{user?.name}</View>;
}
```

## Performance
```
// ✅ Memoize
const Item = React.memo(function Item({ data }) { ... });
// ✅ FlatList over .map()
<FlatList data={items} renderItem={renderItem} />
```

## Platform-Specific
```
import { Platform } from "react-native";
const padding = Platform.OS === "ios" ? 16 : 8;
```

# React Native Patterns
- Zustand for global, useState for local
- Navigation: React Navigation
- Testing: Jest + React Native Testing Library

## Checklist
- [ ] Hooks over class components
- [ ] `FlashList` for lists > 20 items
- [ ] `React.memo` on expensive items
- [ ] `StyleSheet.create()` over inline styles
- [ ] Platform-specific files (`.ios.tsx` / `.android.tsx`)
- [ ] Hermes enabled for production builds
- [ ] Before adding dep: search `package.json` + `components/` first
