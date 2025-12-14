// src/features/todo/screen.tsx
import React from 'react';
import TodoList from './components/TodoList';

const TodoScreen: React.FC = () => {
  return (
    // ここではスタイリングやプロバイダーはせず、ルートで用意した PaperProvider／Portal.Host を使う
    <TodoList />
  );
};

export default TodoScreen;