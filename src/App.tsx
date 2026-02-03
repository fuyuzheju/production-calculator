import { useState, useEffect } from 'react';
import { useStore } from './store'; // 引入类型
import RootNodeCard from './NodeCard';
import SummaryModal from './SummaryModal';
import StatsPanel from './StatsPanel';
import Zoomer from './Zoomer';
import TabsBar from './TabsBar';

import './App.css';
import { init } from './lib';

const useGlobalShortcuts = () => {
    const {
        selectedNodeId,
        copyNode,
        pasteNode,
        removeNode,
        selectNode,
    } = useStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. 如果焦点在输入框或文本域内，不触发快捷键（保留系统的复制粘贴文本功能）
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            const MacOS = /mac/i.test(navigator.userAgent);
            const isCmdOrCtrl = MacOS ? e.metaKey : e.ctrlKey; // Windows用Ctrl, Mac用Command(Meta)

            if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
                if (selectedNodeId) {
                    e.preventDefault();
                    copyNode();
                }
            }

            if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
                if (selectedNodeId) {
                    e.preventDefault();
                    pasteNode();
                }
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeId) {
                    e.preventDefault();
                    if (confirm("确定删除当前节点及其所有子节点吗？")) {
                        removeNode(selectedNodeId);
                    }
                    selectNode(null);
                }
            }

            if (e.key === 'Escape') {
                selectNode(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, copyNode, pasteNode, removeNode, selectNode]);
};

export default function ProdCalc() {
    const { activePhase, selectNode, loadProject } = useStore();

    const [scale, setScale] = useState(1.0);
    const [isSummaryOpen, setSummaryOpen] = useState(false);

    useGlobalShortcuts();
    useEffect(() => {
        init(loadProject);
    }, [loadProject]);

    return (
        <div onClick={() => selectNode(null)} className="app">
            <SummaryModal isOpen={isSummaryOpen} onClose={() => setSummaryOpen(false)} />

            <header className="app-header">
                <TabsBar />
            </header>


            <div className="app-bodypart">
                <StatsPanel setSummaryOpen={setSummaryOpen} />
                <main className="app-main">
                    <div className="tree-container" style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                        {/* 加个 key 强制切换项目时重新渲染动画 */}
                        <RootNodeCard key={activePhase.rootNode.id} node={activePhase.rootNode} />
                    </div>
                </main>

                <Zoomer scale={scale} setScale={setScale} />
            </div>

        </div>
    );
}