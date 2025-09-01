export interface VendingMachineLocation {
  id: string;
  x: number;
  y: number;
}

export const vendingMachineLocations: VendingMachineLocation[] = [
  { 
    id: '体育倉庫前1', 
    x: 335, 
    y: 500, 
  },
  { 
    id: '体育倉庫前2', 
    x: 370, 
    y: 525, 
  },
  { 
    id: '3号館前', 
    x: 375, 
    y: 970, 
  },
  { 
    id: '5号館前', 
    x: 615, 
    y: 1225, 
  },
  { 
    id: '10号館中', 
    x: 380, 
    y: 1245, 
  },
  { 
    id: '11号館中', 
    x: 430, 
    y: 1190, 
  },
  { 
    id: '12号館中', 
    x: 455, 
    y: 1320, 
  },
  { 
    id: '13号館1階', 
    x: 580, 
    y: 860, 
  },
  { 
    id: '13号館外', 
    x: 530, 
    y: 860, 
  },
  { 
    id: '14号館2階', 
    x: 605, 
    y: 925, 
  },
  {
    id: 'ダビンチホール',
    x: 680, 
    y: 940,
  },
  {
    id: 'パスカルホール',
    x: 770, 
    y: 985,
  },
  { 
    id: 'ファラディホール中', 
    x: 670,
    y: 1030, 
  },
  { 
    id: '体育館中', 
    x: 850, 
    y: 1330, 
  },
  // ... 他のアイテム
];
