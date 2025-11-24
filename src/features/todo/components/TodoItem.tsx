// src/features/todo/components/TodoItem.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,              // ★ 追加
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Todo } from '../types';
import { useStyles } from '~/styles';
import { useAppTheme } from '~/hooks/useAppTheme';

interface Props {
  todo: Todo;
  onViewDetail: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const CIRCLE_SIZE = 20;

const TodoItem: React.FC<Props> = ({
  todo,
  onViewDetail,
  onDelete,
  onToggleComplete,
}) => {
  const { colors } = useStyles();
  const { theme } = useAppTheme();

  const handleToggle = () => {
    onToggleComplete(todo.id);
  };

  const handleDetail = () => {
    onViewDetail(todo);
  };

  // ★ ゴミ箱タップ時の確認ダイアログ
  const handleDeletePress = () => {
    Alert.alert(
      '本当に削除しますか？',
      'このToDoを削除すると元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => onDelete(todo.id),
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceSolid, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        {/* ◯ チェック用 */}
        <Pressable
          onPress={handleToggle}
          style={styles.checkWrapper}
          hitSlop={8}
        >
          <View
            style={[
              styles.circle,
              { borderColor: theme.textColor },
            ]}
          >
            {todo.completed && (
              <Text
                style={[
                  styles.checkMark,
                  { color: theme.textColor },   // ★ 枠と同じ色
                ]}
              >
                ✓
              </Text>
            )}
          </View>
        </Pressable>

        {/* 本文（詳細表示） */}
        <TouchableOpacity
          style={styles.content}
          activeOpacity={0.8}
          onPress={handleDetail}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.textColor,
                textDecorationLine: todo.completed ? 'line-through' : 'none',
                opacity: todo.completed ? 0.6 : 1,
              },
            ]}
          >
            {todo.text}
          </Text>

          {!!todo.category && (
            <Text
              style={[
                styles.category,
                {
                  color: theme.textColor,
                  opacity: todo.completed ? 0.6 : 0.85,
                },
              ]}
            >
              {todo.category}
            </Text>
          )}

          {!!todo.dueDate && (
            <Text
              style={[
                styles.due,
                {
                  color: theme.textColor,
                  opacity: todo.completed ? 0.5 : 0.8,
                },
              ]}
            >
              期限: {new Date(todo.dueDate).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>

        {/* ゴミ箱 */}
        <IconButton
          icon="trash-can"
          size={22}
          onPress={handleDeletePress}           // ★ 確認付きのハンドラを呼ぶ
          iconColor={theme.textColor}
          style={styles.deleteButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkWrapper: {
    paddingRight: 24,
    paddingVertical: 4,
    marginLeft: 10,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompletedBorder: {
    // 完了時の枠色を変えたいならここで調整
  },
  checkMark: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
    marginTop: -1,   // 中心に調整
  },
  content: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    marginBottom: 2,
  },
  due: {
    fontSize: 13,
  },
  deleteButton: {
    marginLeft: 4,
  },
});

export default TodoItem;
