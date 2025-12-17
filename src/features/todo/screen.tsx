// src/features/todo/screen.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodoList from './components/TodoList';

const TodoScreen: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <TodoList />
    </SafeAreaView>
  );
};

export default TodoScreen;