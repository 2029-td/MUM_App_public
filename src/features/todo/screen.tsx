// React ライブラリから React オブジェクトをインポートします。
// これは JSX を使用するために必要です。
import React from 'react';

// カスタムコンポーネント TodoList をインポートします。
// '@' はプロジェクトのルートディレクトリを指すエイリアスとして設定されています。
import TodoList from './components/TodoList';

const TodoScreen: React.FC = () => {
  return (
    // ここではスタイリングやプロバイダーはせず、ルートで用意した PaperProvider／Portal.Host を使う
    <TodoList />
  );
};

export default TodoScreen;