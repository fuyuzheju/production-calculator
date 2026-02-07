import { useState, useEffect } from 'react';
import { useStore } from './store';
import RootNodeCard from './NodeCard';
import SummaryModal from './SummaryModal';
import StatsPanel from './StatsPanel';
import Zoomer from './Zoomer';
import TabsBar from './TabsBar';

import './App.css';
import { init, waitConfirm } from './lib';
import { useShortcut } from './shortcut';

export default function App() {
    const {
        activePhase, selectedNodeId, activeProjectId, selectNode, loadProject,
        copyNode, pasteNode, removeNode, removeProject,
    } = useStore();

    const [scale, setScale] = useState(1.0);
    const [isSummaryOpen, setSummaryOpen] = useState(false);

    const deleteCurrentNode = async (e: KeyboardEvent) => {
        if ((e.target instanceof HTMLElement) &&
            e.target.tagName.toUpperCase() === "INPUT") return;
        if (selectedNodeId) {
            if (await waitConfirm("确定删除当前节点及其所有子节点吗？")) {
                removeNode(selectedNodeId);
            }
            selectNode(null);
        }
    }

    const closeCurrentProject = () => {
        removeProject(activeProjectId);
    }

    useShortcut("Ctrl+KeyC", copyNode);
    useShortcut("Ctrl+KeyV", pasteNode);
    useShortcut("Ctrl+KeyW", closeCurrentProject, true);
    useShortcut("Backspace", deleteCurrentNode);
    useShortcut("Delete", deleteCurrentNode);

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