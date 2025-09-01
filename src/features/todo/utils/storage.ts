import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types';

export const loadTodos = async (): Promise<Todo[]> => {
  try {
    const storedTodos = await AsyncStorage.getItem('todos');
    if (!storedTodos) return [];

    const parsed = JSON.parse(storedTodos);

    return parsed.map((todo: any): Todo => ({
      ...todo,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      createdAt: todo.createdAt ? new Date(todo.createdAt) : undefined,
    }));
  } catch (error) {
    console.error('Error loading todos', error);
    return [];
  }
};

export const saveTodos = async (todos: Todo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('todos', JSON.stringify(todos));
  } catch (error) {
    console.error('Error saving todos', error);
  }
};
