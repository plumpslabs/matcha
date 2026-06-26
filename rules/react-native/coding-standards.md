# React Native Coding Standards

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

// ✅ Good — memoize
const Item = React.memo(function Item({ data }: { data: Item }) {
  return <View>{data.name}</View>;
});

// ✅ FlatList over .map() for lists
<FlatList data={items} renderItem={renderItem} />
```

## Platform-Specific
```tsx
// ✅ Use Platform, not if/else
import { Platform } from "react-native";
const padding = Platform.OS === "ios" ? 16 : 8;
```

## State
- Zustand for global, useState for local
- Avoid prop drilling — use context or store
