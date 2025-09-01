// src/hooks/useTodos.ts

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { Todo } from '../types';
import { loadTodos, saveTodos } from '../utils/storage';

/**  
 * 外部ライブラリ不要の簡易ID生成  
 * タイムスタンプ＋乱数で一意性を確保  
 */
const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 定期タスク補完ロジックを関数化
  const runRecurrenceCheck = useCallback(async (currentTodos: Todo[]) => {
    const now = new Date();
    const periodMs = 7 * 24 * 60 * 60 * 1000;   // 1週間
    const offsetMs = 6 * 24 * 60 * 60 * 1000;   // 生成タイミング＝期日の6日前（深夜0時想定）

    // コピーして更新
    const updatedTodos: Todo[] = currentTodos.map(t => ({ ...t }));
    const newTodos: Todo[] = [];

    currentTodos.forEach((todo, idx) => {
      if (!todo.recurring || !todo.dueDate) return;

      const originalDue = new Date(todo.dueDate);
      const generatedSet = new Set<string>(todo.generatedDates || []);

      // k=1以降の各週分をチェック
      for (let k = 1; ; k++) {
        const dueMs = originalDue.getTime() + k * periodMs;
        const createdAtMs = dueMs - offsetMs;

        // 生成タイミングが未来なら終了
        if (createdAtMs > now.getTime()) break;

        const dueInstance = new Date(dueMs);
        const iso = dueInstance.toISOString().split('T')[0];
        if (generatedSet.has(iso)) continue;

        newTodos.push({
          ...todo,
          id: generateId(),
          dueDate: dueInstance,
          completed: false,
          createdAt: new Date(createdAtMs),
          // 自動生成タスク自身には further-generated 情報を持たせない
          recurring: undefined,
          generatedDates: undefined,
          platform: todo.platform,
        });
        generatedSet.add(iso);
      }

      // 元タスクの生成済みリストを更新
      updatedTodos[idx].generatedDates = Array.from(generatedSet);
    });

    if (newTodos.length > 0) {
      const all = [...updatedTodos, ...newTodos];
      setTodos(all);
      await saveTodos(all);
    }
  }, []);

  // 起動時に一度だけロード＆補完チェック
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadTodos();
        setTodos(loaded);
        await runRecurrenceCheck(loaded);
      } catch (e) {
        console.error('定期タスク起動時補完エラー', e);
      }
    })();
  }, [runRecurrenceCheck]);

  // フォアグラウンド復帰時にも補完チェック
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        runRecurrenceCheck(todos);
      }
    });
    return () => {
      sub.remove();
    };
  }, [todos, runRecurrenceCheck]);

  // todos 変更時は永続化
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // --- 基本操作 ---

  /** 新規タスクを追加 */
  const addTodo = (params: Omit<Todo, 'id' | 'completed'>) => {
    const now = new Date();
    const baseTodo: Todo = {
      ...params,
      id: generateId(),
      completed: false,
      createdAt: now,
      dueDate: params.dueDate ?? null,
      generatedDates: [],
    };

    // 定期課題なら元締切日を「生成済み」としてマーク
    if (params.recurring && params.dueDate) {
      const iso = new Date(params.dueDate).toISOString().split('T')[0];
      baseTodo.generatedDates = [iso];
    }

    setTodos(prev => [...prev, baseTodo]);
  };

  /** 既存タスクを更新 */
  const updateTodo = (updated: Todo) => {
    setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  /** タスクを削除 */
  const removeTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  /** 完了状態をトグル */
  const toggleComplete = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // runRecurrenceCheck を戻り値に含める
  return {
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    toggleComplete,
    runRecurrenceCheck,  // ここを追加
  };
};
