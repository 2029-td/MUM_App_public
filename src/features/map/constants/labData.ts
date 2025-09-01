export interface LabInfo {
  name: string; // 研究室名
  room: string; // 教室
  buildingId: string; // 建物を識別するためのID
}

// 研究室データを定義
export const labData: LabInfo[] = [
  { name: "香取研究室", room: "211", buildingId: "2" },
  { name: "西脇研究室", room: "212", buildingId: "2" },
  { name: "高橋研究室", room: "213B室", buildingId: "2" },
  { name: "村上研究室", room: "214A室", buildingId: "2" },
  { name: "五味研究室", room: "223", buildingId: "2" },
  { name: "吉川研究室", room: "224", buildingId: "2" },
  { name: "山口研究室", room: "224", buildingId: "2" },
  { name: "澤邊研究室", room: "232", buildingId: "2" },
  { name: "関研究室", room: "233", buildingId: "2" },
  { name: "細野研究室", room: "234A室", buildingId: "2" },
  { name: "滕研究室", room: "235", buildingId: "2" },
  { name: "保谷研究室", room: "245", buildingId: "2" },
  { name: "松野研究室", room: "243", buildingId: "2" },
  { name: "望月研究室", room: "244", buildingId: "2" },
];