import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform, PixelRatio, TextInput /* 検索ボックス */} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { MapItem, mapItems } from './constants/mapData';
import { loadClassesData, ClassInfo } from './constants/classesData';
import { labData, LabInfo } from './constants/labData';
import { vendingMachineLocations } from './constants/vendingMachineLocations';
import MapSvg from './assets/images/map.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window'); // 画像の幅と高さを取得
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1920;

const App: React.FC = () => {
  const [scale, setScale] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [selectedClassItem, setSelectedClassItem] = useState<MapItem | null>(null); // 授業検索
  const [selectedLabItem, setSelectedLabItem] = useState<MapItem | null>(null); // 研修室検索
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]); // 授業データを外部 CSV から読み込む
  const [classInfo, setClassInfo] = useState<{ name: string; room: string; teacher: string } | null>(null); // 授業検索で選択された詳細
  const [labInfo, setLabInfo] = useState<{ name: string; room: string } | null>(null); // 研究室情報
  const [searchQuery, setSearchQuery] = useState(''); // 検索ボックスの入力内容を初期化
  const [searchResults, setSearchResults] = useState<
    { type: 'building' | 'class' | 'lab'; data: string; meta?: any }[]
  >([]);  //　検索結果一覧
  const [showVendingMachines, setShowVendingMachines] = useState(false); // 自販機
  const scrollViewRef = useRef<ScrollView>(null);
  const baseScale = useRef(1);

  // 画面サイズに合わせて地図サイズを適切に調整
  let imageWidth: number, imageHeight: number;
  
  // 画面の幅に合わせてスケール計算
  const scaleByWidth = SCREEN_WIDTH / IMAGE_WIDTH;
  const scaleByHeight = SCREEN_HEIGHT / IMAGE_HEIGHT;
  
  // より小さいスケールを選択して画面内に収める
  const fitScale = Math.min(scaleByWidth, scaleByHeight);
  
  imageWidth = IMAGE_WIDTH * fitScale;
  imageHeight = IMAGE_HEIGHT * fitScale;

  useEffect(() => {
    console.log('Device Width:', SCREEN_WIDTH);
    console.log('Device Height:', SCREEN_HEIGHT);
    console.log('Pixel Ratio:', PixelRatio.get());
    console.log('Platform:', Platform.OS);
    console.log('Map Items:', mapItems);
    console.log('Image Width:', imageWidth);
    console.log('Image Height:', imageHeight);
  }, []);

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

  const onPinchGestureEvent = (event: any) => {
    const newScale = Math.min(Math.max(baseScale.current * event.nativeEvent.scale, 0.5), 5);
    setScale(newScale);
  };
  
  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseScale.current = scale;
    }
  };

  // 拡大ボタンを押したときの処理
  const increaseScale = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 5)); 
  };

  // 縮小ボタンを押したときの処理
  const decreaseScale = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

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
      .map(item => ({ 
        type: 'building' as const, 
        data: item.info[0], 
        meta: item 
      }));
    
    // 授業の検索
    const classResults: { type: "class"; data: string; meta: { name: string; room: string; teacher: string; building: MapItem } }[] = allClasses
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
            building: building!, // !でbuildingの存在を保証
          },
        };
      }
    );

    // 研究室の検索
    const labResults: { type: "lab"; data: string; meta: { name: string; room: string; building: MapItem } }[] = labData
      .filter(lab => lab.name.includes(query))
      .map(lab => {
        const building = mapItems.find(b => b.id === lab.buildingId); // 建物IDで建物を取得
        return {
          type: 'lab' as const,
          data: lab.name,
          meta: { name: lab.name, room: lab.room, building: building! }, // !でbuildingの存在を保証
        };
      });

    // 検索結果をセット
    setSearchResults([...buildingResults, ...classResults, ...labResults]);
  };

  // 検索結果をクリックした際の処理
  const handleSearchResultPress = (result: { 
    type: 'building' | 'class' | 'lab'; 
    data: string; 
    meta?: any 
  }) => {
    if (result.type === 'building' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedItem(result.meta);
    } else if (result.type === 'class' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedClassItem(result.meta.building);
      setClassInfo({
        name: result.meta.name,
        room: result.meta.room,
        teacher: result.meta.teacher,
      });
    } else if (result.type === 'lab' && result.meta) {
      reset(); // リセット関数呼び出し
      setSelectedLabItem(result.meta.building);
      setLabInfo({ name: result.meta.name, room: result.meta.room });
    }
    setSearchQuery(''); // 検索クエリを初期化
    setSearchResults([]); // 検索結果を初期化
  };

  // 自動販売機フィルターをクリックしたときの処理
  const toggleVendingMachines = () => {
    setShowVendingMachines(!showVendingMachines);
  };

  // リセット関数
  const reset = () => {
    setSelectedItem(null); // 建物の選択状態をリセット
    setSelectedClassItem(null); // 授業検索結果の選択状態をリセット
    setSelectedLabItem(null); // 研究室検索結果の選択状態をリセット
    setClassInfo(null); // 授業情報をリセット
    setLabInfo(null); // 研究室情報をリセット
  }

  return ( 
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
      >
        {/* ① 外側：縦スクロール用（horizontal を付けない） */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{ minHeight: SCREEN_HEIGHT - 150 }}
          nestedScrollEnabled              // ← ★追加
          maximumZoomScale={5}
          minimumZoomScale={0.5}
        >
          {/* ② 内側：横スクロール用（horizontal を true） */}
          <ScrollView
            horizontal                      // ← ★追加
            nestedScrollEnabled             // ← ★追加
            contentContainerStyle={{ minWidth: SCREEN_WIDTH }}
          >
            <View style={[styles.mapContainer, { width: imageWidth * scale, height: imageHeight * scale }]}>
              <MapSvg
                width={imageWidth * scale}
                height={imageHeight * scale}
              />
                {/* 建物の表示 */}
                {mapItems.map(item => {
                  // nullチェックを追加
                  if (item.x === null || item.y === null || item.width === null || item.height === null) {
                    return null; // オンデマンド授業などは描画しない
                  }
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.mapItem,
                          {
                            left: (item.x / IMAGE_WIDTH) * imageWidth * scale,
                            top: (item.y / IMAGE_HEIGHT) * imageHeight * scale,
                            width: Math.max((item.width / IMAGE_WIDTH) * imageWidth * scale, 10),
                            height: Math.max((item.height / IMAGE_HEIGHT) * imageHeight * scale, 2),
                          },
                          (selectedItem?.id === item.id || selectedClassItem?.id === item.id || selectedLabItem?.id === item.id) && styles.RedBorder
                        ]}
                        onPress={() => handleItemPress(item)}
                      />
                    );
                  }).filter(Boolean) // nullを除外
                }

                {/* 自動販売機アイコンの表示 */}
                {showVendingMachines && vendingMachineLocations.map(vm => (
                  <View
                    key={vm.id}
                    pointerEvents="none" // <- タッチを透過できるようにする
                    style={[
                      styles.vendingMachineIconWrapper,
                      {
                        left: (vm.x / IMAGE_WIDTH) * imageWidth * scale,
                        top: (vm.y / IMAGE_HEIGHT) * imageHeight * scale,
                      }
                    ]}
                  >
                    <Image
                      source={require('./assets/icons/vending_machine_icon.png')}
                      style={[
                        styles.vendingMachineIcon,
                        {
                          transform: [{ scale: scale }],
                        }
                      ]}
                    />
                  </View>
                ))}
            </View>
          </ScrollView>
        </ScrollView>
      </PinchGestureHandler>
      
      {/* 検索バーを追加 */}
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

      {selectedItem && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            {Array.isArray(selectedItem.info)
              ? selectedItem.info.join('\n')
              : selectedItem.info}
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

      {/* フィルターボタンの実装 */}
      <TouchableOpacity style={styles.filterButton} onPress={toggleVendingMachines} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
        <Image
          source={require('./assets/icons/vending_machine_filter.png')} // 自販機アイコン画像
          style={styles.filterIcon}
        />
      </TouchableOpacity>

      {/* 拡大縮小ボタンの実装 */}
      <View style={styles.zoomButtonsContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={increaseScale}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={decreaseScale}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

// スタイルの設定
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  mapContainer: {
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  //　アイテムの色変更
  mapItem: {
    position: 'absolute',
    backgroundColor: 'transparent', // 透明
    borderWidth: 0,
    borderColor: 'red',
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupText: {
    flex: 1,
    fontSize: 16,
  },
  closeButton: {
    padding: 5,
  },

  searchBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  searchDesign: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchResultsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10, // 検索一覧を前面に表示する
    maxHeight: 540, // 検索結果のスクロール下部位置を固定
  },
  searchResultBox: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  RedBorder: {
    borderColor: 'red',  // 枠線の色
    borderWidth: 1.5,  // 枠線の太さ
  },
  filterButton: {
    position: 'absolute',
    top: 500,
    left: 20, 
  },
  filterIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  vendingMachineIcon: {
    position: 'absolute',
    width: 15,  // アイコンのサイズを調整
    height: 15, // アイコンのサイズを調整
    resizeMode: 'contain',
  },
  vendingMachineIconWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },  
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButtonText: {
    fontSize: 18,
    color: 'black',
  },
});
export default App;