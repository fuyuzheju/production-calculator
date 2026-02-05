import React from "react";
import { useStore } from "./store";
import { useMemo, useRef } from "react";
import { saveData } from "./lib";
import { phaseViewRecover, ProjectDataSchema, type AllocNode } from "./data";

import "./StatsPanel.css";
import { useShortcut } from "./shortcut";

type AppStatus = 'error' | 'warning' | 'normal';

function StatsPanel({ setSummaryOpen }: { setSummaryOpen: (open: boolean) => void }) {
    const {
        calculationResult, activePhase,
        activeProject, loadProject, markSaved,
    } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveFile = async () => {
        const success = await saveData(activeProject, `${activeProject.name || 'allocation'}-data.ratio`);
        if (success) {
            markSaved(activeProject.id);
        } else {
            alert("保存取消或失败");
        }
    }

    const handleOpenFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const data: unknown = JSON.parse(json);
                const parsedData = ProjectDataSchema.parse(data);
                parsedData.phases.forEach(ph => phaseViewRecover(ph));
                loadProject(parsedData);
            } catch (err) {
                alert('文件格式无效');
                console.error(err);
            }
        };
        reader.readAsText(file);

        // 清空 input 使得同一个文件可以被重复选择
        e.target.value = '';
    };

    useShortcut("Ctrl+KeyO", handleOpenFile);
    useShortcut("Ctrl+KeyS", handleSaveFile);

    const { stats, appStatus, statusMessage, statusIcon } = useMemo(() => {
        const countNodes = (node: AllocNode): number =>
            1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
        const countLeaves = (node: AllocNode): number =>
            node.children.length === 0 ? 1 : node.children.reduce((sum, c) => sum + countLeaves(c), 0);

        const allResults = Object.values(calculationResult);

        let currentStatus: AppStatus = 'normal';

        const hasError = allResults.some(r => r.isError);
        const hasWarning = !hasError && allResults.some(r => r.isWarning);

        if (hasError) currentStatus = 'error';
        else if (hasWarning) currentStatus = 'warning';

        const icons = {
            normal: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
            warning: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="6" x2="12" y2="16" />
                    <circle cx="12" cy="20" r="0.5" fill="currentColor" />
                </svg>
            ),
            error: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            ),
        };
        const messages = {
            normal: "分配正常",
            warning: "分配不足",
            error: "分配超额",
        }

        return {
            stats: {
                totalNodes: countNodes(activePhase.rootNode),
                leafCount: countLeaves(activePhase.rootNode),
            },
            appStatus: currentStatus,
            statusMessage: messages[currentStatus],
            statusIcon: icons[currentStatus]
        };
    }, [calculationResult, activePhase]);

    return (
        <div className="stats-panel">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".ratio"
                onChange={handleFileChange}
            />

            <button title="打开" className="stat-item file-action" onClick={handleOpenFile}>
                {/* open icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <polyline points="12 15 12 9" />
                    <polyline points="9 12 12 9 15 12" />
                </svg>

            </button>
            <button title="保存" className="stat-item file-action" onClick={handleSaveFile}>
                {/* save icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                    <polyline points="16 3 16 8" />
                </svg>
            </button>
            <div className="panel-divider"></div>
            <button title="汇总报表" className="stat-item summary-btn " onClick={() => setSummaryOpen(true)}>
                {/* summary button */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                </svg>
            </button>
            <div className="panel-divider"></div>
            <div title={statusMessage} className={`stat-item ${appStatus}`}>
                {statusIcon}
            </div>
            <div className="panel-divider"></div>
            <div className="stat-item" title="末端节点数量">
                {stats.leafCount}
            </div>
            <div className="stat-item" title="总节点数量">
                {stats.totalNodes}
            </div>
        </div>
    );
};

export default StatsPanel;