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

# 🔎 Reuse check
Before adding npm dep: search package.json + existing components/
