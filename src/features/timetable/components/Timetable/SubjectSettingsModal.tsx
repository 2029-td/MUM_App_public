import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import type { Subject } from '../../types';
import { colorPalette } from '../../constants';
import { showDeleteConfirm } from './showDeleteConfirm';

type Props = {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
  onSubjectUpdate: (updatedSubject: Subject) => void | Promise<void>;
};

export const SubjectSettingsModal: React.FC<Props> = ({
  visible,
  subject,
  onClose,
  onDelete,
  onSubjectUpdate,
}) => {
  const [local, setLocal] = useState<Subject | null>(null);
  const [creditsInput, setCreditsInput] = useState<string>('');
  const [totalClassesInput, setTotalClassesInput] = useState<string>('');

  useEffect(() => {
    if (subject) {
      setLocal({ ...subject });
      setCreditsInput(subject.credits && subject.credits > 0 ? String(subject.credits) : '');
      setTotalClassesInput(subject.totalClasses && subject.totalClasses > 0 ? String(subject.totalClasses) : '15');
    } else {
      setLocal(null);
      setCreditsInput('');
      setTotalClassesInput('');
    }
  }, [subject, visible]);

  const handleColorChange = useCallback(async (color: string) => {
    if (!local) return;
    const updated = { ...local, color };
    setLocal(updated);
    await Promise.resolve(onSubjectUpdate(updated));
  }, [local, onSubjectUpdate]);

  const commitCredits = useCallback(async () => {
    if (!local) return;
    const parsed = parseInt(creditsInput, 10);
    const committed = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const updated = { ...local, credits: committed };
    setLocal(updated);
    setCreditsInput(committed > 0 ? String(committed) : '');
    await Promise.resolve(onSubjectUpdate(updated));
  }, [creditsInput, local, onSubjectUpdate]);

  const commitTotalClasses = useCallback(async () => {
    if (!local) return;
    const parsed = parseInt(totalClassesInput, 10);
    const committed = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
    const updated = { ...local, totalClasses: committed };
    setLocal(updated);
    setTotalClassesInput(String(committed));
    await Promise.resolve(onSubjectUpdate(updated));
  }, [totalClassesInput, local, onSubjectUpdate]);

  const handleDelete = useCallback(() => {
    showDeleteConfirm(async () => {
      await Promise.resolve(onDelete());
      onClose();
    });
  }, [onDelete, onClose]);

  if (!local) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>科目設定</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="設定を閉じる">
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>科目の色を選択</Text>
            <View style={styles.palette}>
              {colorPalette.map((c, i) => (
                <TouchableOpacity
                  key={`${c}-${i}`}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    local.color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => handleColorChange(c)}
                />
              ))}
            </View>

            {/* 🔥 単位数 & 総授業回数：横並びに変更 */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>単位数</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={creditsInput}
                  onChangeText={setCreditsInput}
                  onEndEditing={commitCredits}
                  placeholder="単位数"
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>総授業回数</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={totalClassesInput}
                  onChangeText={setTotalClassesInput}
                  onEndEditing={commitTotalClasses}
                  placeholder="例: 15"
                />
              </View>
            </View>

            {/* 削除 */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>科目を削除</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  card: {
    width: '100%', maxWidth: 560, maxHeight: '90%',
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd',
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  close: { fontSize: 22, lineHeight: 22, color: '#555', paddingHorizontal: 4 },

  body: { padding: 16 },

  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },

  colorDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  colorDotSelected: { borderWidth: 3, borderColor: '#000' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },

  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, color: '#333'
  },

  deleteButton: {
    marginTop: 8, backgroundColor: '#F44336',
    paddingVertical: 12, borderRadius: 6, alignItems: 'center'
  },
  deleteText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SubjectSettingsModal;
