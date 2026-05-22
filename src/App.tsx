import { Outlet } from 'react-router-dom';
import Layout from './components/Layout';

// 根组件 - 包含全局布局
function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default App;
