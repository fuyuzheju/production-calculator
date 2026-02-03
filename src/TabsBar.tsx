import { useMemo } from 'react';
import { useStore } from './store';

import "./TabsBar.css"

const TabsBar = () => {
    const {
        projects, activeProject, activePhase, projectsSaved,
        addProject, switchProject, removeProject,
        addPhase, switchPhase, removePhase,
        // 新增的修改方法
        setTotalValue, setPhaseValue, updateProjectName,
    } = useStore();

    // 计算逻辑：计算当前项目下所有分期的总和 & 余额
    const { totalPhaseValue: _, balance } = useMemo(() => {
        if (!activeProject) return { totalPhaseValue: 0, balance: 0 };
        
        const phases = activeProject.phases || [];
        const sum = phases.reduce((acc, cur) => acc + (Number(cur.phaseValue) || 0), 0);
        const bal = (Number(activeProject.totalValue) || 0) - sum;
        
        return { totalPhaseValue: sum, balance: bal };
    }, [activeProject]);

    return (
        <div className="tabs-container">
            <div className="tabs-bar">
                <div className="tabs-list">
                    {projects.map((proj, idx) => (
                        <div
                            key={proj.id}
                            className={`tab-item project-tab ${activeProject?.id === proj.id ? 'active' : ''}`}
                            style={{ transform: `translateX(-${idx * 4}px)` }}
                            onClick={() => switchProject(proj.id)}
                            onDoubleClick={() => updateProjectName(proj.id, prompt("修改项目名称", proj.name) || proj.name)}
                        >
                            <span className="tab-name">{projectsSaved[proj.id] ? '' : '*'}{proj.name}</span>
                            {projects.length > 1 && (
                                <span className="tab-close" onClick={(e) => { e.stopPropagation(); removeProject(proj.id); }}>&times;</span>
                            )}
                        </div>
                    ))}
                </div>
                <button className="add-tab-btn" onClick={addProject}>+</button>
            </div>

            {/* --- 第二层：分期详情与数值配置 (Phase Level) --- */}
            {activeProject && (
                <div className="phase-bar">
                    
                    {/* 1. 最前面：项目总值 */}
                    <div className="phase-item total-group">
                        <label className="phase-name">总产值</label>
                        <input 
                            type="number"
                            className="phase-input"
                            value={activeProject.totalValue || ''}
                            onChange={(e) => setTotalValue(activeProject.id, Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>

                    {/* 2. 中间：分期列表 (Tab + 输入框) */}
                    <div className="phase-list">
                        {activeProject.phases?.map((phase) => (
                            <div
                                key={phase.id}
                                className={`phase-item ${activePhase?.id === phase.id ? 'active' : ''}`}
                                onClick={() => switchPhase(phase.id)}
                            >
                                <div style={{display: 'flex'}}>
                                    <span className="phase-name">{phase.name}</span>
                                    <span 
                                        className="phase-close"
                                        onClick={(e) => { e.stopPropagation(); removePhase(phase.id); }}
                                    >
                                        &times;
                                    </span>
                                </div>
                                
                                {/* 分期数值输入 */}
                                <input
                                    type="number"
                                    className="phase-input"
                                    value={phase.phaseValue || ''}
                                    onClick={(e) => e.stopPropagation()} // 防止点击输入框触发 switchPhase
                                    onChange={(e) => setPhaseValue(phase.id, Number(e.target.value))}
                                    placeholder="0"
                                />

                            </div>
                        ))}
                        
                        <button className="add-phase-btn" onClick={addPhase} title="添加分期">
                            +
                        </button>
                    </div>

                    {/* 3. 最后面：余额显示 */}
                    <div className={`phase-item balance-group ${balance < 0 ? 'negative' : ''}`}>
                        <label className="phase-name">余款</label>
                        <span className="balance-value">{balance.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabsBar;