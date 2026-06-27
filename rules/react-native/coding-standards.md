---
paths:
- "**/*.tsx"
- "**/*.jsx"
---

# React Native Coding Standards

> This file extends [common/coding-standards.md](../common/coding-standards.md) with React Native-specific rules.

## Hooks over Classes
```tsx
// ❌ Bad — class component
class Profile extends React.Component { ... }

// ✅ Good — function + hooks
function Profile() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { loadUser(); }, []);
  return <View>{user?.name}</View>;
}
```

## Performance
```tsx
// ❌ Bad — re-renders on every parent change
function Item({ data }: { data: Item }) { ... }

// ✅ Good — memoize with comparison
const Item = React.memo(function Item({ data }: { data: Item }) {
  return <View><Text>{data.name}</Text></View>;
});

// ✅ FlashList over FlatList for lists > 20 items
import { FlashList } from "@shopify/flash-list";
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
/>

// ✅ Avoid anonymous functions in renderItem
const renderItem = useCallback(({ item }: { item: Item }) => (
  <ItemComponent item={item} />
), []);
```

## Image Optimization
```tsx
// ✅ Specify dimensions for performance
<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
  fadeDuration={300}
/>

// ✅ Use cache headers for remote images
<Image
  source={{
    uri: imageUrl,
    headers: { Authorization: 'Bearer ...' },
    cache: 'force-cache',
  }}
/>
```

## New Architecture (Fabric + TurboModules)
- Enable in `gradle.properties` (`newArchEnabled=true`) and `Podfile`
- **TurboModules**: direct native method calls without bridge serialization
- **Fabric**: synchronous layout, native event handling
- **JSI**: JavaScript ↔ native shared memory (no JSON bridge)
- Check library compatibility before enabling

## Hermes Engine
```
// android/app/build.gradle
project.ext.react = [
    enableHermes: true,  // enabled by default in RN 0.70+
]
```
- Benefits: faster startup (2x), smaller APK, less memory
- No `Intl` or `Proxy` — use polyfills if needed
- Debug with Hermes: Flipper or react-native log-ios/log-android

## Platform-Specific
```tsx
// ✅ Platform.select for simple cases
import { Platform } from "react-native";
const styles = StyleSheet.create({
  padding: {
    ...Platform.select({
      ios: { paddingTop: 44 },
      android: { paddingTop: 0 },
      default: { paddingTop: 16 },
    }),
  },
});

// ✅ Platform-specific extensions for complex diffs
// Button.ios.tsx → iOS version
// Button.android.tsx → Android version
// Button.tsx → fallback
import Button from './Button';  // auto-resolves per platform
```

## State
- **Zustand** for global app state (consistent with web patterns)
- **TanStack Query** for server state
- **AsyncStorage** / **MMKV** for persistence
- Avoid prop drilling → use context or zustand store
- Consider **useMMKV** from react-native-mmkv for high-frequency writes

## Checklist

- [ ] Hooks over class components
- [ ] `FlashList` over `FlatList` for lists > 20 items
- [ ] `React.memo` on expensive list items
- [ ] `StyleSheet.create()` over inline styles
- [ ] Platform-specific files (`.ios.tsx` / `.android.tsx`) for complex diffs
- [ ] Image dimensions specified for layout performance
- [ ] Zustand for global state, consistent with web patterns
