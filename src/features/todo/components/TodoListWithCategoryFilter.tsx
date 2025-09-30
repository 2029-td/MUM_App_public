// src/features/todo/components/TodoListWithCategoryFilter.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { Portal, Menu, IconButton, Chip } from 'react-native-paper';
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
}

const MENU_WIDTH = 120; // メニューの幅を定数化

const TodoListWithCategoryFilter: React.FC<Props> = ({
  todos,
  onViewDetail,
  onDelete,
  sortBy,
  sortOrder,
  onChangeSort,
}) => {
  const { theme } = useAppTheme();
  const { colors } = useStyles();

  // ── フィルター用状態 ──
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const filterChipRef = useRef<any>(null);
  const [filterAnchor, setFilterAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── ソート用状態 ──
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const sortIconRef = useRef<any>(null);
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
    const handle = findNodeHandle(filterChipRef.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      const GAP = 4;
      setFilterAnchor({ x, y: y + height + GAP });
      setFilterMenuVisible(true);
    });
  };

  // ── ソートメニューを開く ──
  const openSortMenu = () => {
    const handle = findNodeHandle(sortIconRef.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      const GAP = 4;
      // アイコンの右端からメニュー幅を引いて、右端ギリギリに寄せる
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
    setFilterMenuVisible(false);
  };

  // ── 絞り込み適用後リスト ──
  const filteredTodos =
    selectedFilters.length === 0
      ? todos
      : todos.filter(todo =>
          selectedFilters.some(f => {
            if (f === '未完了') return !todo.completed;
            if (f === '完了') return todo.completed;
            return todo.category === f;
          })
        );

  return (
    <View style={{ flex: 1, overflow: 'visible' }}>
      {/* フィルター＆ソート行 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
          overflow: 'visible',
        }}
      >
        {/* 絞り込みチップ */}
        <Portal>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={filterAnchor}
            contentStyle={{ overflow: 'visible', backgroundColor: colors.surfaceSolid }}
          >
            {filterOptions.map(opt => (
              <Menu.Item
                key={opt}
                title={opt}
                onPress={() => toggleFilter(opt)}
                titleStyle={{ color: theme.textColor }}  // ← メニュー項目の文字もテーマ色で
              />
            ))}
          </Menu>
        </Portal>
        <Chip
          ref={filterChipRef}
          mode="flat"
          compact
          style={{ 
            backgroundColor: colors.surfaceSolid, 
            borderColor: colors.border, 
            borderWidth: 1, 
          }}
          textStyle={{ color: theme.textColor }}  //「絞り込み」ボタンをテーマ色に
          onPress={openFilterMenu}
        >
          絞り込み
        </Chip>

        {/* ソートアイコン */}
        <Portal>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={sortAnchor}
            contentStyle={{
              paddingVertical: 0,
              width: MENU_WIDTH,
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: colors.surfaceSolid,
            }}
          >
            {(['追加日', '期限'] as const).map(opt => (
              <Menu.Item
                key={opt}
                title={opt}
                titleStyle={{ color: theme.textColor }}  // ← メニュー内テキストの視認性
                contentStyle={{
                  height: 36,
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
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
              />
            ))}
          </Menu>
        </Portal>
        <IconButton
          ref={sortIconRef}
          icon={sortOrder === 'desc' ? 'sort-ascending' : 'sort-descending'}
          size={24}
          style={{ backgroundColor: colors.surfaceSolid }}
          iconColor={theme.textColor}     // 右上ソートアイコンをテーマの文字色に
          onPress={openSortMenu}
        />
      </View>

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
            style={{ backgroundColor: colors.surfaceSolid, borderColor: colors.border, borderWidth: 1, marginRight: 6, marginBottom: 6,}}
            textStyle={{ color: theme.textColor }}  // ここもテーマの文字色に統一
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
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default TodoListWithCategoryFilter;
