import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'

interface QuickSuggestionsProps {
  suggestions: string[]
  onSelectSuggestion: (suggestion: string) => void
  colors: any
  isDark: boolean
}

export default function QuickSuggestions({
  suggestions,
  onSelectSuggestion,
  colors,
  isDark,
}: QuickSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={[styles.suggestionsLabel, { color: colors.textMuted }]}>💡 Gợi ý trả lời tiếp theo:</Text>
      <FlatList
        horizontal
        data={suggestions}
        keyExtractor={(item, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.suggestionChip,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderColor: colors.borderGlass,
                borderWidth: 1
              }
            ]}
            onPress={() => onSelectSuggestion(item)}
          >
            <Text style={[styles.suggestionChipText, { color: colors.textActive }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  suggestionsContainer: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 6,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
