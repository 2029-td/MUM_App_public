import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Modal, Portal, Text, Button, Paragraph, Chip, IconButton } from 'react-native-paper';
import { Todo } from '../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

interface TodoDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  todo: Todo | null;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
  visible,
  onDismiss,
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
}) => {
  const { theme } = useAppTheme();
  const { colors } = useStyles();
  const [localCompleted, setLocalCompleted] = useState(false);

  useEffect(() => {
    if (todo) {
      setLocalCompleted(todo.completed);
    }
  }, [todo]);

  const handleToggle = () => {
    if (todo) {
      onToggleComplete(todo.id);
      setLocalCompleted(!localCompleted);
    }
  };

  if (!todo) return null;

  const platformUrls: Record<string, string> = {
    classroom: 'https://classroom.google.com/',
    canvas: 'https://nu.instructure.com/?login_success=1',
    moodle: 'https://moodle.ce.cst.nihon-u.ac.jp/',
  };

  const platformLabel: Record<string, string> = {
    classroom: 'Classroom',
    canvas: 'Canvas',
    moodle: 'Moodle',
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: colors.surfaceSolid }]}
        dismissable={false}
      >
        <View style={styles.closeButtonContainer}>
          <IconButton icon="close" size={24} onPress={onDismiss} />
        </View>

        <Text style={[styles.title, { color: theme.textColor }]}>{todo.text}</Text>

        <Paragraph style={{ color: theme.textColor }}>
          タグ: {todo.category || 'なし'}
        </Paragraph>

        {todo.dueDate && (
          <Paragraph style={{ color: theme.textColor }}>
            期限: {new Date(todo.dueDate).toLocaleDateString()}
          </Paragraph>
        )}

        {todo.category === '課題' && todo.platform && (
          <Button
            mode="outlined"
            icon="arrow-right"
            style={{ marginTop: 16 }}
            textColor={theme.textColor}
            onPress={() => Linking.openURL(platformUrls[todo.platform!])}
          >
            {platformLabel[todo.platform]} に移動
          </Button>
        )}

        <View style={styles.buttonGroup}>
          <Button
            mode="contained"
            onPress={handleToggle}
            style={[styles.button, styles.fixedButton]}
            buttonColor={colors.buttonSolidBg}
            textColor={colors.buttonSolidText}
          >
            {localCompleted ? '未完了' : '完了'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => onEdit(todo)}
            style={styles.button}
            textColor={theme.textColor}
          >
            編集
          </Button>

          <Button
            mode="outlined"
            onPress={() => onDelete(todo.id)}
            style={styles.button}
            textColor="red"
          >
            削除
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: 40,
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonGroup: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 10,
    marginTop: 10,
  },
  fixedButton: {
    width: 90,
  },
});

export default TodoDetailModal;
