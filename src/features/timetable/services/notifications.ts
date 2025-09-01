import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 通知の初期設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  async scheduleExamNotification(title: string, body: string, date: Date) {
    const notificationDate = new Date(date);
    notificationDate.setDate(notificationDate.getDate() - 1); // 1日前に通知

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: notificationDate,
    });
  },
};