import React, { useState, useMemo } from 'react';
import { useStore } from './store';
import { aggregateStats, type SourceData } from './core';

import "./SummaryModal.css"

const formatMoney = (val: number) =>
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);

interface GroupedSource {
    key: string;
    projectName: string;
    phaseName: string;
    total: number;
    details: SourceData[];
}

const SourceGroupItem: React.FC<{ group: GroupedSource }> = ({ group }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="source-group-item">
            <div className="group-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                <span className="group-title">
                    <span className="proj">{group.projectName}</span>
                    <span className="sep">/</span>
                    <span className="phase">{group.phaseName}</span>
                </span>
                <span className="group-total">{formatMoney(group.total)}</span>
            </div>

            {isExpanded && (
                <div className="group-details">
                    {group.details.map((detail, idx) => (
                        <div key={idx} className="detail-row">
                            <span className="detail-path">
                                {detail.path.length > 0 ? detail.path.join(' - ') : '基础项'}
                            </span>
                            <span className="detail-amount">{formatMoney(detail.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const SummaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { projects } = useStore();
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    const handleClose = () => {
        setExcludedIds(new Set());
        onClose();
    };

    const toggleProject = (id: string) => {
        const newExcluded = new Set(excludedIds);
        if (newExcluded.has(id)) {
            newExcluded.delete(id);
        } else {
            newExcluded.add(id);
        }
        setExcludedIds(newExcluded);
    };

    const handleSelectAll = () => setExcludedIds(new Set());
    
    const handleDeselectAll = () => {
        const allIds = projects.map(p => p.id);
        setExcludedIds(new Set(allIds));
    };

    const isSelected = (id: string) => !excludedIds.has(id);

    const { stats } = useMemo(() => {
        const activeProjects = projects.filter(p => !excludedIds.has(p.id));
        const calculatedStats = aggregateStats(activeProjects);
        return { stats: calculatedStats };
    }, [projects, excludedIds]);

    const projectLookup = useMemo(() => {
        const map: Record<string, { name: string, phases: Record<string, string> }> = {};
        projects.forEach(p => {
            const phaseMap: Record<string, string> = {};
            if (p.phases) {
                p.phases.forEach(ph => {
                    phaseMap[ph.id] = ph.name;
                });
            }
            map[p.id] = {
                name: p.name,
                phases: phaseMap
            };
        });
        return map;
    }, [projects]);

    const groupSources = (sources: SourceData[]) => {
        const groups: Record<string, GroupedSource> = {};

        sources.forEach(src => {
            const uniqueKey = `${src.projectId}_${src.phaseId}`;

            if (!groups[uniqueKey]) {
                const projectInfo = projectLookup[src.projectId];
                const projectName = projectInfo?.name || '未知项目';
                const phaseName = projectInfo?.phases[src.phaseId] || '未知分期';

                groups[uniqueKey] = {
                    key: uniqueKey,
                    projectName,
                    phaseName,
                    total: 0,
                    details: []
                };
            }
            groups[uniqueKey].total += src.amount;
            groups[uniqueKey].details.push(src);
        });

        return Object.values(groups).sort((a, b) => b.total - a.total);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>全项目人员产值汇总</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="project-filter-section">
                        <div className="filter-actions">
                            <span className="filter-title">参与统计的项目：</span>
                            <div className="filter-btns">
                                <button className="text-btn" onClick={handleSelectAll}>全选</button>
                                <span className="divider">|</span>
                                <button className="text-btn" onClick={handleDeselectAll}>清空</button>
                            </div>
                        </div>
                        <div className="project-checkbox-list">
                            {projects.map(p => (
                                <label key={p.id} className="project-checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected(p.id)}
                                        onChange={() => toggleProject(p.id)}
                                    />
                                    <span className="project-name">{p.name}</span>
                                </label>
                            ))}
                            {projects.length === 0 && <span className="no-data-tip">暂无项目</span>}
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>姓名/团队</th>
                                    <th style={{ width: '15%' }}>总合计</th>
                                    <th style={{ width: '70%' }}>来源构成 (项目/分期)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map(person => (
                                    <tr key={person.name}>
                                        <td className="font-bold sticky-col">{person.name}</td>
                                        <td className="text-right amount-cell sticky-col-2">{formatMoney(person.totalAmount)}</td>
                                        <td className="sources-cell">
                                            <div className="groups-container">
                                                {groupSources(person.sources).map(group => (
                                                    <SourceGroupItem key={group.key} group={group} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {stats.length === 0 && (
                                    <tr><td colSpan={3} className="text-center">
                                        {excludedIds.size === projects.length && projects.length > 0 
                                            ? "请勾选至少一个项目" 
                                            : "暂无数据"}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;