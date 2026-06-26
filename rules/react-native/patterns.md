# React Native Patterns

- **Navigation**: React Navigation typed route params
- **State**: Zustand (consistent with TS project), AsyncStorage for persistence
- **Performance**: `React.memo` + `useMemo` on heavy lists, FlashList over FlatList
- **Testing**: React Native Testing Library
- Overlap check: before adding RN package, search `package.json` and existing native modules