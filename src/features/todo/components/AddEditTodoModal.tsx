import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Paragraph,
  IconButton,
  Menu,
  Chip,
  Checkbox,
  RadioButton,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Todo } from '../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

interface AddEditTodoModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (todo: Omit<Todo, 'id' | 'completed'> & { recurring?: boolean }) => void;
  todo?: Todo | null;
  existingTags: string[];
}

const AddEditTodoModal: React.FC<AddEditTodoModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  todo,
  existingTags,
}) => {
  const { theme, currentThemeId } = useAppTheme();
  const { colors } = useStyles();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tagMenuVisible, setTagMenuVisible] = useState(false);
  const [selectingNewTag, setSelectingNewTag] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [platform, setPlatform] = useState<'classroom' | 'canvas' | 'moodle' | null>(null);

  const textRef = useRef<TextInput>(null);
  const newTagRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && todo) {
      setText(todo.text);
      setCategory(todo.category);
      setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
      setRecurring((todo as any).recurring ?? false);
      setPlatform(todo.platform ?? null);
      setNewTagInput('');
      setSelectingNewTag(false);
      setShowDatePicker(false);
    } else if (visible) {
      resetForm();
    }
  }, [visible, todo]);

  const resetForm = () => {
    setText('');
    setCategory('');
    setDueDate(null);
    setShowDatePicker(false);
    setRecurring(false);
    setPlatform(null);
    setNewTagInput('');
    setSelectingNewTag(false);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    const finalCategory = selectingNewTag ? newTagInput.trim() : category;
    onSubmit({ text: text.trim(), category: finalCategory, dueDate, recurring, platform });
    onDismiss();
  };

  const toggleDatePicker = () => {
    if (dueDate) {
      setDueDate(null);
    } else {
      setShowDatePicker(true);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={false}
        contentContainerStyle={[
          styles.modalContent,
          {
            // ★ モーダルの外側カードは ToDo リストの背景色と同じに
            backgroundColor: colors.background,
            borderRadius: 16,
            // 背景と同色でも浮かせるため、薄い枠＋影を入れておく
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* 閉じるボタン */}
            <View style={styles.closeButtonContainer}>
              <IconButton icon="close" size={24} onPress={onDismiss} iconColor={theme.textColor} />
            </View>

            {/* タスク入力 */}
            <TextInput
              ref={textRef}
              placeholder="タスクを入力"
              defaultValue={text}
              onChangeText={setText}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,   // ★ 入力欄は白(ライト/デフォ) or 濃色(ダーク)
                  color: colors.inputText,
                  borderColor: colors.border,
                },
              ]}
              selectionColor={theme.textColor}
              placeholderTextColor={
                currentThemeId === 'dark' ? '#A9B1C0' : '#9AA4B2'
              }
              autoCapitalize="none"
            />

            {/* タグ選択 */}
            <Paragraph style={[styles.label, { color: theme.textColor }]}>タグを選択</Paragraph>
            <Menu
              visible={tagMenuVisible}
              onDismiss={() => setTagMenuVisible(false)}
              anchor={
                <Chip
                  onPress={() => setTagMenuVisible(true)}
                  mode="flat"
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceSolid, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  textStyle={{ color: colors.text }}
                >
                  {selectingNewTag ? newTagInput || '新しいタグを追加' : category || 'タグを選択する'}
                </Chip>
              }
              contentStyle={{
                backgroundColor: colors.surfaceSolid, // ★ メニュー地を不透明に
                borderRadius: 12,
              }}
            >
              {existingTags.map(tag => (
                <Menu.Item
                  key={tag}
                  title={tag}
                  titleStyle={{ color: theme.textColor }}
                  onPress={() => {
                    setCategory(tag);
                    setSelectingNewTag(false);
                    setNewTagInput('');
                    setTagMenuVisible(false);
                  }}
                />
              ))}
              <Menu.Item
                title="+新たなタグを追加"
                onPress={() => {
                  setSelectingNewTag(true);
                  setCategory('');
                  setTagMenuVisible(false);
                }}
                titleStyle={{ color: theme.textColor, fontWeight: 'bold' }}
              />
            </Menu>
            {selectingNewTag && (
              <TextInput
                ref={newTagRef}
                placeholder="新しいタグを入力"
                defaultValue={newTagInput}
                onChangeText={setNewTagInput}
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border },
                ]}
                selectionColor={theme.textColor}
                placeholderTextColor={
                  currentThemeId === 'dark' ? '#A9B1C0' : '#9AA4B2'
                }
                autoCapitalize="none"
              />
            )}

            {/* プラットフォーム選択（課題タグ時のみ） */}
            {category === '課題' && (
              <>
                <Paragraph style={[styles.label, { color: theme.textColor }]}>
                  提出先
                </Paragraph>
                <View style={styles.radioColumn}>
                  <View style={styles.radioItemRow}>
                    <RadioButton.Android
                      value="classroom"
                      status={platform === 'classroom' ? 'checked' : 'unchecked'}
                      onPress={() => 
                        setPlatform(platform === 'classroom' ? null : 'classroom')
                      }
                      color={theme.textColor}
                    />
                    <Paragraph 
                      style={{ color: theme.textColor, flexShrink: 1 }}
                      onPress={() =>
                        setPlatform(platform === 'classroom' ? null : 'classroom')
                      }
                    >
                      Classroom
                    </Paragraph>
                  </View>

                  <View style={styles.radioItemRow}>
                    <RadioButton.Android
                      value="moodle"
                      status={platform === 'moodle' ? 'checked' : 'unchecked'}
                      onPress={() => 
                        setPlatform(platform === 'moodle' ? null : 'moodle')
                      }
                      color={theme.textColor}
                    />
                    <Paragraph 
                      style={{ color: theme.textColor, flexShrink: 1 }}
                      onPress={() =>
                        setPlatform(platform === 'moodle' ? null : 'moodle')
                      }
                    >
                      Moodle
                    </Paragraph>
                  </View>

                  <View style={styles.radioItemRow}>
                    <RadioButton.Android
                      value="canvas"
                      status={platform === 'canvas' ? 'checked' : 'unchecked'}
                      onPress={() => 
                        setPlatform(platform === 'canvas' ? null : 'canvas')
                      }
                      color={theme.textColor}
                    />
                    <Paragraph 
                      style={{ color: theme.textColor, flexShrink: 1 }}
                      onPress={() =>
                        setPlatform(platform === 'canvas' ? null : 'canvas')
                      }
                    >
                      Canvas
                    </Paragraph>
                  </View>
                </View>
              </>
            )}

            {/* 期限設定 */}
            <Button
              onPress={toggleDatePicker}
              mode="contained"
              style={[
                styles.dateButton,
                { backgroundColor: colors.surfaceSolid, borderColor: colors.border, borderWidth: 1 },
              ]}
              buttonColor={colors.modalSurface}
              textColor={colors.text}
            >
              {dueDate ? `期限: ${dueDate.toLocaleDateString()}（タップで削除）` : '期限を設定'}
            </Button>

            {/* 期限設定ボタンの直後 */}
            {showDatePicker && (
              Platform.OS === 'ios' ? (
                // ← iOS は白いカードでラップして白背景のカレンダーに
                <View
                  style={[
                    styles.iosPickerCard,
                    { borderColor: colors.border }, // テーマの枠線色を反映
                  ]}
                >
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display="inline"          // カレンダー表示
                    themeVariant="light"      // iOS: ライトテーマを強制（白ベース）
                    onChange={(_, selected) => {
                      setShowDatePicker(false);
                      if (selected) {
                        const d = new Date(selected);
                        const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
                        setDueDate(normalized);
                      }
                    }}
                    style={{ alignSelf: 'stretch', backgroundColor: '#fff' }} // 念のため白を指定
                  />
                </View>
              ) : (
                // ← Android は従来どおり（ネイティブダイアログ）
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) {
                      const d = new Date(selected);
                      const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
                      setDueDate(normalized);
                    }
                  }}
                />
              )
            )}

            {/* 定期追加 */}
            <View style={styles.checkboxContainer}>
              <Checkbox.Android
                status={recurring ? 'checked' : 'unchecked'}
                onPress={() => setRecurring(!recurring)}
                color={theme.textColor}
                uncheckedColor={colors.border}
              />
              <Paragraph style={[styles.checkboxLabel, { color: theme.textColor }]}>毎週追加する</Paragraph>
            </View>

            {/* 追加 */}
            <Button
              onPress={handleSubmit}
              mode="contained"
              style={[styles.submitButton, { backgroundColor: colors.surfaceSolid, borderColor: colors.border, borderWidth: 1 },]}
              buttonColor={colors.modalSurface}
              textColor={colors.text}
              contentStyle={{ height: 52 }}
              disabled={!text.trim()}            // ★ 未入力なら無効
            >
              {todo ? '更新' : '追加'}
            </Button>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: { 
    padding: 20, 
    marginHorizontal: 20, 
    marginTop: 40 
  },
  closeButtonContainer: { 
    alignItems: 'flex-end', 
    marginBottom: 10 
  },
  label: { 
    marginTop: 10, 
    marginBottom: 6, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  chip: { 
    marginBottom: 16, 
    alignSelf: 'flex-start' 
  },
  priorityContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  priorityButton: { 
    flex: 1, 
    marginHorizontal: 5 
  },
  priorityText: { 
    marginBottom: 15, 
    fontSize: 16 
  },
  dateButton: { 
    marginBottom: 16 
  },
  pickerSheet: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  iosPickerCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff', // ← 白背景を明示
    overflow: 'hidden',       // 角丸を効かせる
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  checkboxLabel: { 
    fontSize: 16 
  },
  radioColumn: {
    flexDirection: 'column',
    alignSelf: 'stretch',
    marginBottom: 15,
  },
  radioItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  submitButton: { 
    marginTop: 16 
  },
});

export default AddEditTodoModal;
