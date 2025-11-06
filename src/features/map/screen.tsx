import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform, PixelRatio, TextInput } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { MapItem, mapItems } from './constants/mapData';
import { loadClassesData, ClassInfo } from './constants/classesData';
import { labData } from './constants/labData';
import { vendingMachineLocations } from './constants/vendingMachineLocations';
import MapSvg from './assets/images/map.svg';
import type { ViewStyle } from 'react-native';

/** 元画像のピクセルサイズ（SVG の座標系と一致させる） */
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1920;
/** 端末の表示領域サイズ */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** ズーム境界を定数化 */
const MIN_SCALE = 1; // 最小倍率：等倍（初期）
const MAX_SCALE = 5; // 最大倍率
const EPS = 1e-4; // 浮動小数点の誤差吸収

const App: React.FC = () => {
  // 既存ステート（検索/選択など）
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [selectedClassItem, setSelectedClassItem] = useState<MapItem | null>(null); // 授業検索
  const [selectedLabItem, setSelectedLabItem] = useState<MapItem | null>(null); // 研究室検索
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]); // 授業データを外部 CSV から読み込む
  const [classInfo, setClassInfo] = useState<{ name: string; room: string; teacher: string } | null>(null); // 授業検索で選択された詳細
  const [labInfo, setLabInfo] = useState<{ name: string; room: string } | null>(null); // 研究室情報
  const [searchQuery, setSearchQuery] = useState(''); // 検索ボックスの入力内容を初期化
  const [searchResults, setSearchResults] = useState<{ type: 'building' | 'class' | 'lab'; data: string; meta?: any }[]>([]); //　検索結果一覧
  const [showVendingMachines, setShowVendingMachines] = useState(false); // 自動販売機

  // 画像を画面にフィットさせる初期スケール
  const scaleByWidth = SCREEN_WIDTH / IMAGE_WIDTH;
  const scaleByHeight = SCREEN_HEIGHT / IMAGE_HEIGHT;
  const fitScale = Math.min(scaleByWidth, scaleByHeight);
  const imageWidth  = IMAGE_WIDTH  * fitScale;
  const imageHeight = IMAGE_HEIGHT * fitScale;

  // パン・ズーム
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // ジェスチャー操作時の基準値（ドラッグ開始位置 / ピンチ開始倍率）
  const start = {
    x: useSharedValue(0),
    y: useSharedValue(0),
    scale: useSharedValue(1),
  };

  // JS 側にも現在倍率を同期（UIのボタン無効化などで使用）
  const [jsScale, setJsScale] = useState(1);
  const syncScaleToJS = (v: number) => setJsScale(v);

  // 表示コンテナの実サイズ（onLayoutで取得しUIスレッドに渡す）
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

  // UI スレッドで使うクランプ関数（ジェスチャー内で使用）
  const clamp = (v: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(v, min), max);
  };

  // ジェスチャー定義：パン（拡大時のみ有効）
  const pan = Gesture.Pan()
  .enabled(jsScale > MIN_SCALE + EPS) // 等倍時はパン無効
  .onBegin(() => {
    start.x.value = translateX.value;
    start.y.value = translateY.value;
  })
  .onChange((e) => {
    if (scale.value <= MIN_SCALE + EPS) return;
    // 仮の次位置
    let nextX = start.x.value + e.translationX;
    let nextY = start.y.value + e.translationY;
    // 現在スケールにおける最大可動量（余白が出ない範囲）
    const maxX = Math.max(0, (imageWidth  * scale.value - containerW.value) / 2);
    const maxY = Math.max(0, (imageHeight * scale.value - containerH.value) / 2);
    // クランプ
    translateX.value = clamp(nextX, -maxX,  maxX);
    translateY.value = clamp(nextY, -maxY,  maxY);
  });

  // ジェスチャー定義：ピンチ（倍率更新＆位置クランプ）
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      start.scale.value = scale.value;
    })
    .onChange((e) => {
      const raw = start.scale.value * e.scale;
      const s = Math.min(Math.max(raw, MIN_SCALE), MAX_SCALE);
      scale.value = s;
      runOnJS(syncScaleToJS)(s); // ボタン活性/非活性のためJSにも同期

      // 倍率変化に合わせて、現在位置も再クランプ
      const maxX = Math.max(0, (imageWidth  * s - containerW.value) / 2);
      const maxY = Math.max(0, (imageHeight * s - containerH.value) / 2);
      translateX.value = s <= MIN_SCALE + EPS ? withTiming(0, { duration: 120 }) : clamp(translateX.value, -maxX, maxX);
      translateY.value = s <= MIN_SCALE + EPS ? withTiming(0, { duration: 120 }) : clamp(translateY.value, -maxY, maxY);
    });

  // 同時認識（パン＋ピンチ）
  const composed = Gesture.Simultaneous(pan, pinch);

  // スケールが変わったときは常にクランプ（ボタン操作にも効かせる）
  useAnimatedReaction(
    () => scale.value,
    (s) => {
      const maxX = Math.max(0, (imageWidth  * s - containerW.value) / 2);
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

  // 地図レイヤーに適用する transform スタイル
  const mapAnimatedStyle = useAnimatedStyle<ViewStyle>(() => {
    const t = [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ] as const;
    return { transform: t as ViewStyle['transform'] };
  });

  // 地図上の建物/自販機をクリックした時の処理
  const handleItemPress = (item: MapItem) => {
    reset(); // リセット関数呼び出し
    setSelectedItem(item);
  };

  // ポップアップを閉じる処理
  const handleClosePopup = () => {
    reset(); // リセット関数呼び出し
  };

  // 検索機能の実装
  const handleSearch = (query: string) => { // handleSearchは検索ボックスの入力内容を処理
    setSearchQuery(query); // 入力された値queryをsearchQueryに設定

    // 建物の検索
    const buildingResults: { type: "building"; data: string; meta: MapItem }[] = mapItems
      .filter(item => item.info[0].includes(query))
      .map(item => ({ type: 'building' as const, data: item.info[0], meta: item }));

    // 授業の検索
    const classResults: { type: "class"; data: string; meta: { name: string; room: string; teacher: string; building: MapItem } }[] =
      allClasses
        .filter(cls => cls.name.includes(query) || cls.teacher.includes(query))
        .map(cls => {
          const building = mapItems.find(b => b.id === cls.buildingId) ?? mapItems.find(b => b.id === '0'); // 建物IDで建物を取得
          return {
            type: 'class' as const,
            data: `${cls.name}（${cls.teacher}）`,
            meta: { 
              name: cls.name, 
              room: cls.room, 
              teacher: cls.teacher, 
              building: building! // !でbuildingの存在を保証
            },
          };
        }
      );

    // 研究室の検索
    const labResults: { type: "lab"; data: string; meta: { name: string; room: string; building: MapItem } }[] =labData.filter(lab => lab.name.includes(query)).map(lab => {
      const building = mapItems.find(b => b.id === lab.buildingId)!; // 建物IDで建物を取得
      return { 
        type: 'lab' as const, 
        data: lab.name, 
        meta: { name: lab.name, room: lab.room, building } 
      };
    });

    // 検索結果をセット
    setSearchResults([...buildingResults, ...classResults, ...labResults]);
  };

  // 検索結果をクリックした際の処理
  const handleSearchResultPress = (result: { type: 'building' | 'class' | 'lab'; data: string; meta?: any }) => {
    if (result.type === 'building' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedItem(result.meta);
    } else if (result.type === 'class' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedClassItem(result.meta.building);
      setClassInfo({ name: result.meta.name, room: result.meta.room, teacher: result.meta.teacher });
    } else if (result.type === 'lab' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedLabItem(result.meta.building);
      setLabInfo({ name: result.meta.name, room: result.meta.room });
    }
    setSearchQuery(''); // 検索クエリを初期化
    setSearchResults([]); // 検索結果を初期化
  };

  // 自動販売機フィルターをクリックしたときの処理
  const toggleVendingMachines = () => setShowVendingMachines(v => !v);

  // リセット関数
  const reset = () => {
    setSelectedItem(null); // 建物の選択状態をリセット
    setSelectedClassItem(null); // 授業検索結果の選択状態をリセット
    setSelectedLabItem(null); // 研究室検索結果の選択状態をリセット
    setClassInfo(null); // 授業情報をリセット
    setLabInfo(null); // 研究室情報をリセット
  };

  // ---- 拡大縮小ボタン（共通の挙動に統一）----
  const canZoomOut = jsScale > MIN_SCALE + EPS;
  const canZoomIn = jsScale < MAX_SCALE - EPS;

  const increaseScale = () => {
    const next = Math.min(jsScale + 0.1, MAX_SCALE);
    scale.value = withTiming(next, { duration: 120 });
    setJsScale(next);
  };
  
  const decreaseScale = () => {
    const next = Math.max(jsScale - 0.1, MIN_SCALE);
    scale.value = withTiming(next, { duration: 120 });
    setJsScale(next);
    if (next <= MIN_SCALE + EPS) {
      // 等倍になったら原点へ
      translateX.value = withTiming(0, { duration: 120 });
      translateY.value = withTiming(0, { duration: 120 });
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* パン/ピンチのジェスチャーはキャンバス全体に付与 */}
      <GestureDetector gesture={composed}>
        <View
          style={styles.flexFill}
          onLayout={(e) => {
            containerW.value = e.nativeEvent.layout.width;
            containerH.value = e.nativeEvent.layout.height;
          }}
        >
          {/* 地図全体（SVG＋当たり判定＋自販機）を 1 レイヤーとして transform */}
          <Animated.View
            style={[
              { width: imageWidth, height: imageHeight },
              mapAnimatedStyle,
            ]}
          >
            {/* 地図 SVG */}
            <MapSvg width={imageWidth} height={imageHeight} />

            {/* 建物のヒットエリア（レイヤー transform に追従）*/}
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
                    (selectedItem?.id === item.id || selectedClassItem?.id === item.id || selectedLabItem?.id === item.id) && styles.RedBorder,
                  ]}
                  onPress={() => handleItemPress(item)}
                />
              );
            })}

            {/* 自動販売機アイコン（レイヤー transform に追従）*/}
            {showVendingMachines && vendingMachineLocations.map(vm => (
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

      {/* 検索バー */}
      <View style={styles.searchBar}>
        <TextInput // 検索ボックスを表示するためのコンポーネント
          style={styles.searchDesign} // 検索ボックスのデザインをsearchDesignで指定
          placeholder="検索" // 検索ボックスのヒントテキスト
          value={searchQuery} // 検索ボックスに表示するテキストの内容
          onChangeText={handleSearch} // ユーザーが入力を行うたびにhandleSearch関数を実行
        />
        {searchQuery.length > 0 && ( // 検索ボックスに入力がある時に以下のコードを実行
          // 検索結果のカードを追加
          <ScrollView style={styles.searchResultsContainer}>
            {searchResults.map((result, index) => ( // searchResults配列に入っているデータをmap関数で表示
              <TouchableOpacity // タップ可能なエリアを作成
                key={index}
                style={styles.searchResultBox} // 検索結果カードのデザインをsearchResultBoxで指定
                onPress={() => handleSearchResultPress(result)} // タップするとhandleSearchResultPressを実行
              >
                {/*検索結果カードにresult.dataを表示する*/}
                <Text>
                  {result.data}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ポップアップ（固定配置） */}
      {selectedItem && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            {Array.isArray(selectedItem.info) ? selectedItem.info.join('\n') : selectedItem.info}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      {classInfo && selectedClassItem && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            授業名：{classInfo.name}（{classInfo.teacher}）{'\n'}
            教室：{classInfo.room}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      {labInfo && selectedLabItem && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            研究室名：{labInfo.name}{'\n'}
            教室：{labInfo.room}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}

      {/* 自動販売機フィルターボタン（固定配置） */}
      <TouchableOpacity style={styles.filterButton} onPress={toggleVendingMachines} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
        <Image source={require('./assets/icons/vending_machine_filter.png')} style={styles.filterIcon} />
      </TouchableOpacity>

      {/* 拡大・縮小ボタン（固定配置） */}
      <View style={styles.zoomButtonsContainer}>
        {/* 拡大ボタン */}
        <TouchableOpacity
          onPress={increaseScale}
          disabled={!canZoomIn} // ← マップ最大時は押せない
          accessibilityState={{ disabled: !canZoomIn }}
          style={[styles.zoomButton, !canZoomIn && styles.zoomButtonDisabled]}
        >
          <Text style={styles.zoomLabel}>＋</Text>
        </TouchableOpacity>

        {/* 縮小ボタン */}
        <TouchableOpacity
          onPress={decreaseScale}
          disabled={!canZoomOut} // ← マップ最小時（初期画面）は押せない
          accessibilityState={{ disabled: !canZoomOut }}　// ← アクセシビリティ連動
          style={[styles.zoomButton, !canZoomOut && styles.zoomButtonDisabled]}
        >
          <Text style={styles.zoomLabel}>−</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

// スタイルの設定
const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  // キャンバスを中央に配置（等倍時はここが“固定端”になる）
  flexFill: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // アイテムの色変更
  mapItem: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'red',
  },
  RedBorder: {
    borderColor: 'red', // 枠線の色
    borderWidth: 1.5, // 枠線の太さ
  },

  // ポップアップ
  popup: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 100,
  },
  popupText: { flex: 1, fontSize: 16 },
  closeButton: { padding: 5 },

  // 検索
  searchBar: { 
    position: 'absolute', 
    top: 20, 
    left: 20, 
    right: 20 
  },
  searchDesign: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchResultsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    maxHeight: 540,
  },
  searchResultBox: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    top: 500,
    left: 20,
    zIndex: 1,
    elevation: 2,
  },
  filterIcon: { 
    width: 50, 
    height: 50, 
    resizeMode: 'contain' 
  },

  // 拡大縮小ボタン
  zoomButtonsContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  zoomButton: {
    backgroundColor: 'white',
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
  },
  zoomButtonDisabled: { 
    opacity: 0.4 // 無効時は薄くする
  },
  zoomLabel: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000', 
    textAlign: 'center' 
  },
});

export default App;