# React Native Patterns

## Navigation
- **React Navigation** with typed route params (`NativeStackScreenProps`)
- Deep linking config at root navigator level
- Screen components: one screen = one file, colocate hooks

## State Management
- **Zustand** for global app state (consistent with TS project)
- **AsyncStorage** for persistence + **zustand/middleware** persist
- **MMKV** (v3+) for high-frequency writes (over AsyncStorage 10x faster)
- React Query for server state (consistent with web patterns)

## New Architecture (Fabric + TurboModules)
- Enable New Architecture in `gradle.properties` / `Podfile` for new projects
- **TurboModules**: native module access without bridge overhead
- **Fabric**: synchronous native UI rendering
- **JSI**: direct JS ↔ native communication (no JSON serialization)

## Performance
```tsx
// ✅ FlashList over FlatList for lists > 20 items
import { FlashList } from "@shopify/flash-list";
<FlashList data={items} renderItem={renderItem} estimatedItemSize={80} />

// ✅ React.memo + useMemo on heavy screens
const Item = React.memo(({ data }: { data: Item }) => (
    <View style={styles.item}>
        <Text>{data.name}</Text>
    </View>
));

// ✅ Image optimization
<Image
    source={{ uri: imageUrl }}
    style={styles.image}
    resizeMode="cover"
    fadeDuration={300}
/>
```

## Hermes Engine
- Enable Hermes in production (default in RN 0.70+)
- Hermes benefits: faster startup, smaller bundle, less memory
- Debug with Hermes: use Flipper or `react-native log-ios` / `log-android`
- No `Intl`, no `Proxy` — polyfill if needed

## Styling
- `StyleSheet.create()` over inline styles or object literals
- Flexbox layout (default flexDirection: column)
- `useWindowDimensions()` for responsive layout
- Platform-specific: `.ios.tsx` / `.android.tsx` for complex diffs
- Design system: shared theme tokens (colors, spacing, typography)

## Testing
- **React Native Testing Library** (RNTL)
- Detox for e2e on both platforms
- Mock native modules with jest.mock
- Snapshot tests for screens (update on intentional changes)

## Dependency Check
Before adding an RN package:
1. Search `package.json` + existing native modules
2. Check if it supports New Architecture (Fabric/TurboModules)
3. Prefer libraries with native C++ implementation over JS-only bridges