// src/features/map/screen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHeaderHeight } from '@react-navigation/elements';
import type { ViewStyle } from 'react-native';

// 各種データ読み込み
import { MapItem, mapItems } from './constants/mapData';
import { loadClassesData, ClassInfo } from './constants/classesData';
import { labData } from './constants/labData';
import { vendingMachineLocations } from './constants/vendingMachineLocations';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';
import MapSvg from './assets/images/map.svg';

// 元画像のピクセルサイズ（SVG の座標系と一致させる）
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1920;

// 端末の表示領域サイズ
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ズーム境界を定数化
const MIN_SCALE = 1; // 最小倍率：等倍（初期）
const MAX_SCALE = 5; // 最大倍率
const EPS = 1e-4; // 浮動小数点の誤差吸収

const App: React.FC = () => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // ✅ テーマ取得
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  // ✅ マップ画面で使う “カード面/入力面” の色
  const screenBg = theme.backgroundColor;

  const cardBg = useMemo(() => {
    return isDark
      ? compositeOver('rgba(255,255,255,0.06)', theme.backgroundColor)
      : '#FFFFFF';
  }, [isDark, theme.backgroundColor]);

  const inputBg = useMemo(() => {
    return isDark
      ? compositeOver('rgba(255,255,255,0.15)', theme.backgroundColor)
      : '#FFFFFF';
  }, [isDark, theme.backgroundColor]);

  const inputBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)';
  const divider = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  const primaryText = theme.textColor;
  const secondaryText = isDark ? 'rgba(255,255,255,0.75)' : '#333';
  const iconColor = isDark ? 'rgba(255,255,255,0.85)' : '#000';
  
  const topOffset = Math.max(headerHeight, insets.top) + 20;

  // 既存ステート（検索/選択など）
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [selectedClassItem, setSelectedClassItem] = useState<MapItem | null>(null);
  const [selectedLabItem, setSelectedLabItem] = useState<MapItem | null>(null);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [classInfo, setClassInfo] = useState<{
    name: string;
    room: string;
    teacher: string;
    campus: string;
  } | null>(null);
  const [labInfo, setLabInfo] = useState<{ name: string; room: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { type: 'building' | 'class' | 'lab'; data: string; meta?: any }[]
  >([]);
  const [showVendingMachines, setShowVendingMachines] = useState(false);

  // 画像を画面にフィットさせる初期スケール
  const scaleByWidth = SCREEN_WIDTH / IMAGE_WIDTH;
  const scaleByHeight = SCREEN_HEIGHT / IMAGE_HEIGHT;
  const fitScale = Math.min(scaleByWidth, scaleByHeight);
  const imageWidth = IMAGE_WIDTH * fitScale;
  const imageHeight = IMAGE_HEIGHT * fitScale;

  // パン・ズーム
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // ジェスチャー操作時の基準値
  const start = {
    x: useSharedValue(0),
    y: useSharedValue(0),
    scale: useSharedValue(1),
  };

  // JS 側にも現在倍率を同期
  const [jsScale, setJsScale] = useState(1);
  const jsScaleRef = React.useRef(1);
  useEffect(() => {
    jsScaleRef.current = jsScale;
  }, [jsScale]);
  const syncScaleToJS = (v: number) => setJsScale(v);

  // 表示コンテナの実サイズ
  const containerW = useSharedValue(SCREEN_WIDTH);
  const containerH = useSharedValue(SCREEN_HEIGHT);

  // 起動時に CSV から授業データを読み込む
  useEffect(() => {
    loadClassesData()
      .then(data => {
        setAllClasses(data);
        console.log('loaded classes:', data.length);
      })
      .catch(err => {
        console.error('failed to load classes CSV:', err);
      });
  }, []);

  // 等倍に戻ったら位置を原点に戻す（保険）
  useEffect(() => {
    if (jsScale <= MIN_SCALE + EPS) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [jsScale, translateX, translateY]);

  // UI スレッドで使うクランプ関数
  const clamp = (v: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(v, min), max);
  };

  // ジェスチャー定義：パン
  const pan = Gesture.Pan()
    .enabled(jsScale > MIN_SCALE + EPS)
    .onBegin(() => {
      start.x.value = translateX.value;
      start.y.value = translateY.value;
    })
    .onChange(e => {
      if (scale.value <= MIN_SCALE + EPS) return;
      let nextX = start.x.value + e.translationX;
      let nextY = start.y.value + e.translationY;

      const maxX = Math.max(0, (imageWidth * scale.value - containerW.value) / 2);
      const maxY = Math.max(0, (imageHeight * scale.value - containerH.value) / 2);

      translateX.value = clamp(nextX, -maxX, maxX);
      translateY.value = clamp(nextY, -maxY, maxY);
    });

  // ジェスチャー定義：ピンチ
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      start.scale.value = scale.value;
    })
    .onChange(e => {
      const raw = start.scale.value * e.scale;
      const s = Math.min(Math.max(raw, MIN_SCALE), MAX_SCALE);
      scale.value = s;
      runOnJS(syncScaleToJS)(s);

      const maxX = Math.max(0, (imageWidth * s - containerW.value) / 2);
      const maxY = Math.max(0, (imageHeight * s - containerH.value) / 2);

      translateX.value =
        s <= MIN_SCALE + EPS ? withTiming(0, { duration: 120 }) : clamp(translateX.value, -maxX, maxX);
      translateY.value =
        s <= MIN_SCALE + EPS ? withTiming(0, { duration: 120 }) : clamp(translateY.value, -maxY, maxY);
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  // スケールが変わったときは常にクランプ
  useAnimatedReaction(
    () => scale.value,
    s => {
      const maxX = Math.max(0, (imageWidth * s - containerW.value) / 2);
      const maxY = Math.max(0, (imageHeight * s - containerH.value) / 2);
      if (s <= MIN_SCALE + EPS) {
        translateX.value = 0;
        translateY.value = 0;
      } else {
        translateX.value = clamp(translateX.value, -maxX, maxX);
        translateY.value = clamp(translateY.value, -maxY, maxY);
      }
    }
  );

  // 地図レイヤーに適用する transform
  const mapAnimatedStyle = useAnimatedStyle<ViewStyle>(() => {
    const t = [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }] as const;
    return { transform: t as ViewStyle['transform'] };
  });

  // 建物タップ
  const handleItemPress = (item: MapItem) => {
    reset();
    setSelectedItem(item);
  };

  const handleClosePopup = () => {
    reset();
  };

  // 検索
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    const buildingResults: { type: 'building'; data: string; meta: MapItem }[] = mapItems
      .filter(item => item.info[0].includes(query))
      .map(item => ({ type: 'building' as const, data: item.info[0], meta: item }));

    const classResults: {
      type: 'class';
      data: string;
      meta: { name: string; room: string; teacher: string; campus: string; building?: MapItem };
    }[] = allClasses
      .filter(cls => cls.name.includes(query) || cls.teacher.includes(query))
      .map(cls => {
        const building = cls.campus === '船橋' && cls.buildingId ? mapItems.find(b => b.id === cls.buildingId) : undefined;

        return {
          type: 'class' as const,
          data: `${cls.name}（${cls.teacher}）`,
          meta: {
            name: cls.name,
            room: cls.room,
            teacher: cls.teacher,
            campus: cls.campus,
            ...(building ? { building } : {}),
          },
        };
      });

    const labResults: { type: 'lab'; data: string; meta: { name: string; room: string; building: MapItem } }[] = labData
      .filter(lab => lab.name.includes(query))
      .map(lab => {
        const building = mapItems.find(b => b.id === lab.buildingId)!;
        return { type: 'lab' as const, data: lab.name, meta: { name: lab.name, room: lab.room, building } };
      });

    setSearchResults([...buildingResults, ...classResults, ...labResults]);
  };

  const handleSearchResultPress = (result: { type: 'building' | 'class' | 'lab'; data: string; meta?: any }) => {
    if (result.type === 'building' && result.meta) {
      reset();
      setSelectedItem(result.meta);
    } else if (result.type === 'class' && result.meta) {
      reset();
      if (result.meta.building) {
        setSelectedClassItem(result.meta.building);
      }
      setClassInfo({
        name: result.meta.name,
        room: result.meta.room,
        teacher: result.meta.teacher,
        campus: result.meta.campus,
      });
    } else if (result.type === 'lab' && result.meta) {
      reset();
      setSelectedLabItem(result.meta.building);
      setLabInfo({ name: result.meta.name, room: result.meta.room });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleVendingMachines = () => setShowVendingMachines(v => !v);

  // 拡大縮小ボタン
  const canZoomOut = jsScale > MIN_SCALE + EPS;
  const canZoomIn = jsScale < MAX_SCALE - EPS;

  const clampTranslate = (s: number, tx: number, ty: number) => {
    const maxX = Math.max(0, (imageWidth * s - containerW.value) / 2);
    const maxY = Math.max(0, (imageHeight * s - containerH.value) / 2);
    return {
      tx: clamp(tx, -maxX, maxX),
      ty: clamp(ty, -maxY, maxY),
    };
  };

  const zoomAroundCenterTo = (s1: number) => {
    const s0 = scale.value;
    const Fx = containerW.value / 2;
    const Fy = containerH.value / 2;

    const r = s1 / s0;
    const tx = Fx - r * (Fx - translateX.value);
    const ty = Fy - r * (Fy - translateY.value);

    const { tx: clampedX, ty: clampedY } = clampTranslate(s1, tx, ty);
    translateX.value = withTiming(clampedX, { duration: 120 });
    translateY.value = withTiming(clampedY, { duration: 120 });
    scale.value = withTiming(s1, { duration: 120 });
    setJsScale(s1);
  };

  const ZOOM_STEP = 0.15;

  const increaseScale = () => {
    setJsScale(prev => {
      const next = Math.min(prev + ZOOM_STEP, MAX_SCALE);
      if (next === prev) return prev;
      zoomAroundCenterTo(next);
      return next;
    });
  };

  const decreaseScale = () => {
    setJsScale(prev => {
      const next = Math.max(prev - ZOOM_STEP, MIN_SCALE);
      if (next === prev) return prev;

      if (next <= MIN_SCALE + EPS) {
        scale.value = withTiming(1, { duration: 120 });
        translateX.value = withTiming(0, { duration: 120 });
        translateY.value = withTiming(0, { duration: 120 });
      } else {
        zoomAroundCenterTo(next);
      }
      return next;
    });
  };

  const zoomTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startContinuousZoom = (direction: 'in' | 'out') => {
    if (zoomTimerRef.current) return;
    const tick = () => {
      if (direction === 'in') {
        if (jsScaleRef.current >= MAX_SCALE - EPS) {
          stopContinuousZoom();
          return;
        }
        increaseScale();
      } else {
        if (jsScaleRef.current <= MIN_SCALE + EPS) {
          stopContinuousZoom();
          return;
        }
        decreaseScale();
      }
    };
    tick();
    zoomTimerRef.current = setInterval(tick, 120);
  };

  const stopContinuousZoom = () => {
    if (zoomTimerRef.current) {
      clearInterval(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }
  };

  const reset = () => {
    setSelectedItem(null);
    setSelectedClassItem(null);
    setSelectedLabItem(null);
    setClassInfo(null);
    setLabInfo(null);
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: screenBg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]} edges={['top', 'left', 'right']}>
        <GestureDetector gesture={composed}>
          <View
            style={[styles.flexFill, { backgroundColor: screenBg }]}
            onLayout={e => {
              containerW.value = e.nativeEvent.layout.width;
              containerH.value = e.nativeEvent.layout.height;
            }}
          >
            <Animated.View style={[{ width: imageWidth, height: imageHeight }, mapAnimatedStyle]}>
              <MapSvg width={imageWidth} height={imageHeight} />

              {mapItems.map(item => {
                if (item.x == null || item.y == null || item.width == null || item.height == null) return null;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.mapItem,
                      {
                        left: (item.x / IMAGE_WIDTH) * imageWidth,
                        top: (item.y / IMAGE_HEIGHT) * imageHeight,
                        width: Math.max((item.width / IMAGE_WIDTH) * imageWidth, 10),
                        height: Math.max((item.height / IMAGE_HEIGHT) * imageHeight, 2),
                      },
                      (selectedItem?.id === item.id || selectedClassItem?.id === item.id || selectedLabItem?.id === item.id) &&
                        styles.RedBorder,
                    ]}
                    onPress={() => handleItemPress(item)}
                  />
                );
              })}

              {showVendingMachines &&
                vendingMachineLocations.map(vm => (
                  <View
                    key={vm.id}
                    pointerEvents="none"
                    style={[
                      styles.vendingMachineIconWrapper,
                      {
                        left: (vm.x / IMAGE_WIDTH) * imageWidth,
                        top: (vm.y / IMAGE_HEIGHT) * imageHeight,
                      },
                    ]}
                  >
                    <Image
                      source={require('./assets/icons/vending_machine_icon.png')}
                      style={styles.vendingMachineIcon}
                    />
                  </View>
                ))}
            </Animated.View>
          </View>
        </GestureDetector>

        {/* 検索バー（✅ ヘッダー分だけ下げる） */}
        <View style={[styles.searchBar, { top: topOffset }]}>
          <TextInput
            style={[
              styles.searchDesign,
              {
                backgroundColor: inputBg,
                color: primaryText,
                borderColor: inputBorder,
              },
            ]}
            placeholder="検索"
            placeholderTextColor={isDark ? 'rgba(236,239,244,0.55)' : 'rgba(44,62,80,0.45)'}
            value={searchQuery}
            onChangeText={handleSearch}
          />

          {searchQuery.length > 0 && (
            <ScrollView
              style={[
                styles.searchResultsContainer,
                {
                  backgroundColor: cardBg,
                  borderColor: inputBorder,
                },
              ]}
            >
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.searchResultBox, { borderBottomColor: divider }]}
                  onPress={() => handleSearchResultPress(result)}
                >
                  <Text style={{ color: secondaryText }}>{result.data}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ポップアップ（建物タップ時） */}
        {selectedItem && (
          <View style={[styles.popup, { backgroundColor: cardBg, borderColor: inputBorder }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
              <Icon name="close" size={20} color={iconColor} />
            </TouchableOpacity>

            <Text style={[styles.popupText, { color: primaryText }]}>
              {Array.isArray(selectedItem.info) ? selectedItem.info.join('\n') : selectedItem.info}
            </Text>
          </View>
        )}

        {/* ポップアップ（授業検索時） */}
        {classInfo && (
          <View style={[styles.popup, { backgroundColor: cardBg, borderColor: inputBorder }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
              <Icon name="close" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={styles.popupTextContainer}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>科目：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{classInfo.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>教室：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{classInfo.room}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>校舎：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{classInfo.campus}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>教員：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{classInfo.teacher}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ポップアップ（研究室検索時） */}
        {labInfo && selectedLabItem && (
          <View style={[styles.popup, { backgroundColor: cardBg, borderColor: inputBorder }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
              <Icon name="close" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={styles.popupTextContainer}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>研究室：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{labInfo.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: primaryText }]}>教室　：</Text>
                <Text style={[styles.infoValue, { color: primaryText }]}>{labInfo.room}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 自動販売機フィルターボタン */}
        <TouchableOpacity
          style={[styles.filterButton, { bottom: insets.bottom + 20 }]}
          onPress={() => setShowVendingMachines(v => !v)}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Image source={require('./assets/icons/vending_machine_filter.png')} style={styles.filterIcon} />
        </TouchableOpacity>

        {/* 拡大・縮小ボタン（✅ 検索バーと同じ基準で下げる） */}
        <View style={[styles.zoomButtonsContainer, { top: topOffset + 60 }]}>
          <TouchableOpacity
            onLongPress={() => startContinuousZoom('in')}
            delayLongPress={150}
            onPressOut={stopContinuousZoom}
            onPress={increaseScale}
            disabled={!canZoomIn}
            style={[
              styles.zoomButton,
              {
                backgroundColor: cardBg,
                borderColor: inputBorder,
              },
              !canZoomIn && styles.zoomButtonDisabled,
            ]}
          >
            <Text style={[styles.zoomLabel, { color: primaryText }]}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onLongPress={() => startContinuousZoom('out')}
            delayLongPress={150}
            onPressOut={stopContinuousZoom}
            onPress={decreaseScale}
            disabled={!canZoomOut}
            style={[
              styles.zoomButton,
              {
                backgroundColor: cardBg,
                borderColor: inputBorder,
              },
              !canZoomOut && styles.zoomButtonDisabled,
            ]}
          >
            <Text style={[styles.zoomLabel, { color: primaryText }]}>−</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// スタイルの設定
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // アイテムの色変更
  mapItem: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'red',
  },
  RedBorder: {
    borderColor: 'red',
    borderWidth: 1.5,
  },

  // ポップアップ
  popup: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 10,
    flexDirection: 'column',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 100,
    borderWidth: 1,
  },
  popupText: {
    flex: 1,
    fontSize: 15,
  },
  popupTextContainer: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 4,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 3,
    zIndex: 10,
  },

  // 検索
  searchBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 50,
  },
  searchDesign: {
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  searchResultsContainer: {
    borderRadius: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderWidth: 1,
  },
  searchResultBox: {
    padding: 15,
    borderBottomWidth: 1,
  },

  // 自動販売機
  vendingMachineIconWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendingMachineIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },

  // 自動販売機フィルターボタン
  filterButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
    elevation: 2,
  },
  filterIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },

  // 拡大縮小ボタン
  zoomButtonsContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column',
    gap: 10,
    zIndex: 40,
  },
  zoomButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  zoomButtonDisabled: {
    opacity: 0.4,
  },
  zoomLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
