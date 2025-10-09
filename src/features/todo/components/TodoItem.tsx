import React from 'react';
import { View } from 'react-native';
import { Card, List, Chip, IconButton } from 'react-native-paper';
import { Todo } from '../types';
import { useStyles } from '~/styles';
import { useAppTheme } from '~/hooks/useAppTheme';

interface Props {
  todo: Todo;
  onViewDetail: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<Props> = ({ todo, onViewDetail, onDelete }) => {
  const { theme } = useAppTheme();
  const { styles } = useStyles();
  const titleColor = theme.textColor;
  const descColor = theme.textColor + 'CC'; // 80%（好みで調整）

  return (
    <Card
      style={[styles.todoItem, { marginTop: 8 }]}
      onPress={() => onViewDetail(todo)}
    >
      <Card.Content>
        <List.Item
          title={todo.text}
          titleStyle={{ color: titleColor, fontWeight: '600' }}
          description={`${todo.category || 'タグなし'}\n${
            todo.dueDate ? `期限: ${new Date(todo.dueDate).toLocaleDateString()}` : ''
          }`}
          descriptionNumberOfLines={2}
          descriptionStyle={{ color: descColor }}
          left={props => (
            <List.Icon
              {...props}
              color={descColor}
              icon={todo.completed ? 'check-circle' : 'circle-outline'}
            />
          )}
          right={props => (
            <View style={styles.todoItemRight}>
              <IconButton icon="delete" onPress={() => onDelete(todo.id)} iconColor={descColor} />
            </View>
          )}
        />
      </Card.Content>
    </Card>
  );
};

export default TodoItem;
