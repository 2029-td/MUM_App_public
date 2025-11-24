// src/features/todo/components/TodoListWithCategoryFilter.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  findNodeHandle,
  UIManager,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Portal, IconButton, Chip, TouchableRipple, Text } from 'react-native-paper';
import { Todo } from '../types';
import TodoItem from './TodoItem';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

type SortBy = '追加日'  | '期限';
type SortOrder = 'asc' | 'desc';

interface Props {
  todos: Todo[];
  onViewDetail: (todo: Todo) => void;
  onDelete: (id: string) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onChangeSort: (sortBy: SortBy, sortOrder: SortOrder) => void;
  onToggleComplete: (id: string) => void;
}

const MENU_WIDTH = 90;

const TodoListWithCategoryFilter: React.FC<Props> = ({
  todos,
  onViewDetail,
  onDelete,
  sortBy,
  sortOrder,
  onChangeSort,
  onToggleComplete,
}) => {
  const { theme } = useAppTheme();
  const { colors } = useStyles();

  // ── フィルター用状態 ──
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const filterChipWrapperRef = useRef<View | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── ソート用状態 ──
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const sortIconWrapperRef = useRef<View | null>(null);
  const [sortAnchor, setSortAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // カテゴリ＋ステータスの選択肢生成
  const categories = Array.from(
    new Set(todos.map(t => t.category || '').filter(Boolean))
  );
  const allOptions = ['未完了', '完了', ...categories];
  const filterOptions = allOptions.filter(opt => {
    if (selectedFilters.includes(opt)) return false;
    if (selectedFilters.includes('未完了') && opt === '完了') return false;
    if (selectedFilters.includes('完了') && opt === '未完了') return false;
    return true;
  });

  // ── 絞り込みメニューを開く ──
  const openFilterMenu = () => {
    const handle = findNodeHandle(filterChipWrapperRef.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      const GAP = 4;
      setFilterAnchor({ x, y: y + height + GAP });
      setFilterMenuVisible(true);
    });
  };

  // ── ソートメニューを開く ──
  const openSortMenu = () => {
    const handle = findNodeHandle(sortIconWrapperRef.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      const GAP = 4;
      setSortAnchor({
        x: x + width - MENU_WIDTH,
        y: y + height + GAP,
      });
      setSortMenuVisible(true);
    });
  };

  // ── フィルター追加・削除 ──
  const toggleFilter = (opt: string) => {
    setSelectedFilters(prev =>
      prev.includes(opt) ? prev.filter(f => f !== opt) : [...prev, opt]
    );
  };

  // ── 絞り込み適用後リスト ──
  const filteredTodos = selectedFilters.length === 0
  ? todos
  : todos.filter(todo => {
      const hasCompletedFilter = selectedFilters.includes('完了');
      const hasIncompleteFilter = selectedFilters.includes('未完了');

      const selectedTags = selectedFilters.filter(
        f => f !== '完了' && f !== '未完了'
      );

      // ① ステータス条件
      const statusMatch =
        (hasCompletedFilter && todo.completed) ||
        (hasIncompleteFilter && !todo.completed) ||
        (!hasCompletedFilter && !hasIncompleteFilter);

      // ② タグ条件（タグが選ばれていない場合はすべて通す）
      const tagMatch =
        selectedTags.length === 0 ||
        selectedTags.includes(todo.category);

      // ③ 両方満たすものだけ表示
      return statusMatch && tagMatch;
    });


  // ── 共通：シンプルなポップアップコンテナ ──
  const PopupContainer: React.FC<{
    visible: boolean;
    anchor: { x: number; y: number };
    width?: number;
    onClose: () => void;
    children: React.ReactNode;
  }> = ({ visible, anchor, width, onClose, children }) => {
    if (!visible) return null;
    return (
      <Portal>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* 背景タップで閉じる */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
          <View
            style={{
              position: 'absolute',
              top: anchor.y,
              left: anchor.x,
              width: width,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surfaceSolid,
                borderRadius: 8,
                // ★ 背景との境目をはっきりさせるための枠線
                borderWidth: 1,
                borderColor: colors.border,
                // ★ 影を強めに付けてカードから浮かせる
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                overflow: 'hidden',
              }}
            >
              {children}
            </View>
          </View>
        </View>
      </Portal>
    );
  };

  return (
    <View style={{ flex: 1, overflow: 'visible' }}>
      {/* フィルター＆ソート行（配置は元のまま） */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
          overflow: 'visible',
        }}
      >
        {/* 絞り込みボタン（位置そのまま） */}
        <View ref={filterChipWrapperRef} collapsable={false}>
          <Chip
            mode="flat"
            compact
            style={{ 
              backgroundColor: colors.surfaceSolid, 
              borderColor: colors.border, 
              borderWidth: 1, 
            }}
            textStyle={{ color: theme.textColor }}
            onPress={openFilterMenu}
          >
            絞り込み
          </Chip>
        </View>

        {/* ソートボタン（位置そのまま） */}
        <View ref={sortIconWrapperRef} collapsable={false}>
          <IconButton
            icon={sortOrder === 'desc' ? 'sort-ascending' : 'sort-descending'}
            size={24}
            style={{ backgroundColor: colors.surfaceSolid }}
            iconColor={theme.textColor}
            onPress={openSortMenu}
          />
        </View>
      </View>

      {/* フィルターポップアップ */}
      <PopupContainer
        visible={filterMenuVisible}
        anchor={filterAnchor}
        onClose={() => setFilterMenuVisible(false)}
      >
        <ScrollView
          style={{ maxHeight: 240 }}             // ← 高さ制限
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {filterOptions.map(opt => (
            <TouchableRipple
              key={opt}
              onPress={() => {
                toggleFilter(opt);
                setFilterMenuVisible(false);
              }}
            >
              <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: theme.textColor, fontSize: 16 }}>
                  {opt}
                </Text>
              </View>
            </TouchableRipple>
          ))}
        </ScrollView>
      </PopupContainer>

      {/* ソートポップアップ */}
      <PopupContainer
        visible={sortMenuVisible}
        anchor={sortAnchor}
        width={MENU_WIDTH}
        onClose={() => setSortMenuVisible(false)}
      >
        {(['追加日', '期限'] as const).map(opt => (
          <TouchableRipple
            key={opt}
            onPress={() => {
              const nextOrder =
                sortBy === opt
                  ? sortOrder === 'desc'
                    ? 'asc'
                    : 'desc'
                  : 'desc';
              onChangeSort(opt, nextOrder);
              setSortMenuVisible(false);
            }}
          >
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              {/* ★ ソート項目の文字も拡大 */}
              <Text style={{ color: theme.textColor, fontSize: 16 }}>
                {opt}
              </Text>
            </View>
          </TouchableRipple>
        ))}
      </PopupContainer>

      {/* 選択中フィルターChip */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: 10,
          marginBottom: 10,
          overflow: 'visible',
        }}
      >
        {selectedFilters.map(f => (
          <Chip
            key={f}
            mode="flat"
            compact
            style={{
              backgroundColor: colors.surfaceSolid,
              borderColor: colors.border,
              borderWidth: 1,
              marginRight: 6,
              marginBottom: 6,
            }}
            textStyle={{ color: theme.textColor }}
            onClose={() => toggleFilter(f)}
          >
            {f}
          </Chip>
        ))}
      </View>

      {/* Todo一覧 */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onViewDetail={onViewDetail}
            onDelete={onDelete}
            onToggleComplete={onToggleComplete}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default TodoListWithCategoryFilter;
