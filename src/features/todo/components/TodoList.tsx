// src/features/todo/components/TodoList.tsx

import React, { useState, useRef, useEffect } from 'react';
import { View, findNodeHandle, UIManager } from 'react-native';
import { FAB, Menu } from 'react-native-paper';
import TodoListWithCategoryFilter from './TodoListWithCategoryFilter';
import AddEditTodoModal from './AddEditTodoModal';
import TodoDetailModal from './TodoDetailModal';
import { useTodos } from '../hooks/useTodos';
import { useStyles } from '~/styles';
import { Todo } from '../types';
import { useAppTheme } from '~/hooks/useAppTheme';

const TodoList: React.FC = () => {
  const { todos, addTodo, updateTodo, removeTodo, toggleComplete } = useTodos();
  const { styles, colors } = useStyles();
  const { currentThemeId } = useAppTheme();

  // ★ テーマ別のFABカラー
  const FAB_COLORS = {
    default: '#556EA4',
    light:   '#2196F3', // 明るい青
    dark:    '#374859', // 濃い黒
  } as const;
  const fabBg   = currentThemeId === 'dark' ? FAB_COLORS.dark : FAB_COLORS.default;
  const fabIcon = '#FFFFFF';

  // ── モーダル制御ステート ──
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── ソート制御ステート ──
  const [sortBy, setSortBy] = useState<'追加日' | '期限'>('追加日');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ── タグ集計＋「課題」を先頭 ──
  const tagCounts: Record<string, number> = {};
  todos.forEach(todo => {
    if (todo.category) {
      tagCounts[todo.category] = (tagCounts[todo.category] || 0) + 1;
    }
  });
  let existingTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tag]) => tag);
  if (!existingTags.includes('課題')) {
    existingTags.unshift('課題');
  } else {
    existingTags = ['課題', ...existingTags.filter(t => t !== '課題')];
  }

  // ── 定期追加ロジック ──
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const updated: Todo[] = [];

    todos.forEach(todo => {
      if (!todo.recurring || !todo.dueDate) return;
      const generated = new Set(todo.generatedDates ?? []);
      const original = new Date(todo.dueDate);
      const originalStr = original.toISOString().split('T')[0];
      let next = new Date(original);
      let hasNew = false;

      while (next.toISOString().split('T')[0] <= todayStr) {
        const iso = next.toISOString().split('T')[0];
        if (!generated.has(iso) && iso !== originalStr) {
          // id, completed を除いたデータ構造で addTodo
          addTodo({
            ...todo,
            dueDate: new Date(next),
            createdAt: new Date(next.getTime() - 7 * 24 * 60 * 60 * 1000),
            recurring: undefined,
            generatedDates: undefined,
          });
          generated.add(iso);
          hasNew = true;
        }
        next.setDate(next.getDate() + 7);
      }
      if (hasNew) {
        updated.push({ ...todo, generatedDates: Array.from(generated) });
      }
    });

    updated.forEach(updateTodo);
  }, [todos, addTodo, updateTodo]);

  // ── createdAt 補完＋ソート ──
  const todosWithCreatedAt = todos.map((t, i) => ({
    ...t,
    createdAt: (t as any).createdAt ?? new Date(i),
  }));
  const sortedTodos = [...todosWithCreatedAt].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case '期限': {
        const aT = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bT = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return -dir * (aT - bT);
      }
      default: {
        const aT = new Date(a.createdAt).getTime();
        const bT = new Date(b.createdAt).getTime();
        return dir * (aT - bT);
      }
    }
  });

  // ── 追加／更新ハンドラ ──
  const handleAddOrUpdate = (
    data: Omit<Todo, 'id' | 'completed'> & { recurring?: boolean }
  ) => {
    const now = new Date();
    if (editingTodo) {
      updateTodo({ ...data, id: editingTodo.id, completed: editingTodo.completed });
    } else {
      addTodo({ ...data, createdAt: now } as Todo & { createdAt: Date });
    }
    setShowModal(false);
    setTimeout(() => setEditingTodo(null), 200);
  };

  // ── モーダル開閉ハンドラ ──
  const openAddModal = (todo?: Todo) => {
    if (todo) setEditingTodo(todo);
    setShowModal(true);
  };
  const closeAddModal = () => {
    setShowModal(false);
    setTimeout(() => setEditingTodo(null), 200);
  };
  const openDetailModal = (todo: Todo) => {
    setSelectedTodo(todo);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => setShowDetailModal(false);
  const handleDelete = (id: string) => {
    removeTodo(id);
    closeDetailModal();
  };

  return (
    <View style={[styles.container, { overflow: 'visible' }]}>
      {/* フィルター＋ソート コンポーネント */}
      <TodoListWithCategoryFilter
        todos={sortedTodos}
        onViewDetail={openDetailModal}
        onDelete={handleDelete}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onChangeSort={(by, order) => {
          setSortOrder(order);
        }}
      />

      {/* 追加ボタン */}
      <FAB
        style={[styles.fab, { backgroundColor: fabBg }]} // ★ 背景色
        icon="plus"
        color={fabIcon}                                     // ★ アイコン色
       onPress={() => openAddModal()}
      />

      {/* Add/Edit モーダル */}
      {showModal && (
        <AddEditTodoModal
          visible={showModal}
          onDismiss={closeAddModal}
          onSubmit={handleAddOrUpdate}
          todo={editingTodo}
          existingTags={existingTags}
        />
      )}

      {/* Detail モーダル */}
      {showDetailModal && selectedTodo && (
        <TodoDetailModal
          visible={showDetailModal}
          onDismiss={closeDetailModal}
          todo={selectedTodo}
          onToggleComplete={toggleComplete}
          onDelete={handleDelete}
          onEdit={todo => {
            closeDetailModal();
            openAddModal(todo);
          }}
        />
      )}
    </View>
  );
};

export default TodoList;
