import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>工具</h1>
        {/* <p style={styles.subtitle}>
          这是一个专为提高效率打造的单页计算工具。
          <br />
          基于 React + TypeScript 构建，简单、快速、精准。
        </p> */}
        
        {/* 使用 Link 进行无刷新跳转 */}
        <div style={styles.tool}>
            <h2>产值计算工具</h2>
            <Link to="/prodcalc" style={styles.button}>
            开始使用
            </Link>
        </div>
      </header>
    </div>
  );
};

// 使用 Record<string, React.CSSProperties> 来定义样式字典
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center',
    padding: '50px 20px',
    color: '#333',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f0f0',
  },
  tool: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '6px',
  },
  header: {
    marginBottom: '60px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '40px',
    lineHeight: '1.6',
  },
  button: {
    display: 'inline-block',
    padding: '15px 40px',
    fontSize: '1.2rem',
    color: '#fff',
    backgroundColor: '#007bff',
    textDecoration: 'none',
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
    transition: 'transform 0.2s',
  },
  features: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
    color: '#888',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureItem: {
    border: '1px solid #ddd',
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#fff',
  }
};

export default WelcomePage;