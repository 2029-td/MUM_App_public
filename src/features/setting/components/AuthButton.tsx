import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
  connected: boolean;
};

const AuthButton: React.FC<Props> = ({ onPress, connected }) => (
  <TouchableOpacity
    style={[
      styles.button,
      connected ? styles.connected : styles.disconnected,
    ]}
    onPress={onPress}
  >
    <Text style={styles.text}>
      {connected ? '連携解除' : '連携する'}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#4285F4',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AuthButton;