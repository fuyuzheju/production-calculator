import React from 'react';
import { useStore } from './store';
import { aggregateGlobalStats, calculateTree } from './core';

import "./SummaryModal.css"

const formatMoney = (val: number) =>
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const SummaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { projects } = useStore();

    if (!isOpen) return null;

    // 实时计算汇总数据
    const stats = aggregateGlobalStats(projects, calculateTree);
    const totalAll = stats.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>全项目人员产值汇总</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="summary-banner">
                        <span className="label">所有项目总产值：</span>
                        <span className="value">{formatMoney(totalAll)}</span>
                    </div>

                    <table className="summary-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>姓名/团队</th>
                                <th style={{ width: '30%' }} className="text-right">总合计</th>
                                <th style={{ width: '50%' }}>来源构成</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map(person => (
                                <tr key={person.name}>
                                    <td className="font-bold">{person.name}</td>
                                    <td className="text-right amount-cell">{formatMoney(person.totalAmount)}</td>
                                    <td>
                                        <div className="source-tags">
                                            {person.sources.map((src, idx) => (
                                                <div key={idx} className="source-tag">
                                                    <span className="src-name">{src.path.reduce((curr, nodeName) => curr+'->'+nodeName, '')}</span>
                                                    <span className="src-val">{formatMoney(src.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr><td colSpan={3} className="text-center">暂无末级节点数据</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;