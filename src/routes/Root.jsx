import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App.jsx';

const Root = () => (
  <Routes>
    <Route index element={<App />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default Root;
