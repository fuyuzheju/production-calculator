// src/core.ts

import type { PhaseData, PreAllocation, ProjectData, AllocNode } from "./data";
import { RuleType } from "./data";

// --- 类型定义 ---

export type CalculationMap = Record<string, {
    amount: number;          // 最终分到的钱
    percentOfParent: number; // 占比
    isError: boolean;        // 是否自身金额为负（接收到了负资产）
    isWarning: boolean;
    unallocated: number;     // 新增：该节点未分配给子节点的余额
}>;

export const calculateTree = (
    node: AllocNode,
    inputAmount: number,
    resultMap: CalculationMap = {}
): CalculationMap => {

    // 初始化当前节点结果
    // 注意：初始 unallocated 设为 0，会在函数末尾更新
    resultMap[node.id] = {
        amount: inputAmount,
        percentOfParent: 0,
        isError: inputAmount < -0.01, // 初始化判断，函数末尾计算完unallocated后仍然会判断
        isWarning: false, // 初始化，在函数末尾更新
        unallocated: inputAmount,
    };

    if (!node.children || node.children.length === 0) {
        return resultMap;
    }

    const fixedNodes = node.children.filter(c => c.rule.type === RuleType.FIXED);
    const percentNodes = node.children.filter(c => c.rule.type === RuleType.PERCENTAGE);
    const remainderNodes = node.children.filter(c => c.rule.type === RuleType.REMAINDER);

    let remainingAmount = inputAmount;

    // 1. 扣除固定金额
    fixedNodes.forEach(child => {
        const allocated = child.rule.value;
        remainingAmount -= allocated;
        calculateTree(child, allocated, resultMap);
        resultMap[child.id].percentOfParent = inputAmount === 0 ? 0 : (allocated / inputAmount);
    });

    // 2. 扣除百分比
    percentNodes.forEach(child => {
        const allocated = inputAmount * (child.rule.value / 100);
        remainingAmount -= allocated;
        calculateTree(child, allocated, resultMap);
        resultMap[child.id].percentOfParent = child.rule.value / 100;
    });

    // 3. 分配剩余部分 & 计算未分配余额
    if (remainderNodes.length > 0) {
        // 如果有"吸纳剩余"的节点，它们会把剩余的钱（无论是正还是负）都拿走
        // 所以此时父节点的 unallocated 必定为 0
        const amountPerNode = remainingAmount / remainderNodes.length;
        remainderNodes.forEach(child => {
            calculateTree(child, amountPerNode, resultMap);
            resultMap[child.id].percentOfParent = inputAmount === 0 ? 0 : (amountPerNode / inputAmount);
        });
        resultMap[node.id].unallocated = 0;
    } else {
        // 修改 2: 如果没有"吸纳剩余"节点，剩余的钱（正数或负数）就留在了父节点手里
        // 只有当 remainingAmount > 0 时我们视作"未分配"（Warning）
        // 如果 remainingAmount < 0，其实也是 Error（超额分配），但我们主要通过 isError 标记来追踪
        resultMap[node.id].unallocated = remainingAmount;
    }

    // 判断isError
    resultMap[node.id].isError = inputAmount < -0.01 || resultMap[node.id].unallocated < -0.01;
    resultMap[node.id].isWarning = (!resultMap[node.id].isError) &&
        (resultMap[node.id].unallocated > 0.01) &&
        (node.children.length > 0);

    return resultMap;
};

const applyPreAllcation = (phaseValue: number, previousValue: number, preAllocation: PreAllocation): number => {
    switch (preAllocation.rule.type) {
        case 'FIXED':
            return previousValue - preAllocation.rule.value;
        case 'PERCENTAGE':
            return previousValue - preAllocation.rule.value / 100 * phaseValue;
    }
}

export const calculatePhaseRestValue = (phase: PhaseData): number => {
    const restValue = phase.preAllocations.reduce(
        (prev, curr) => applyPreAllcation(phase.phaseValue, prev, curr),
        phase.phaseValue
    );
    return restValue;
}

// --- 跨项目汇总逻辑 ---
export interface PersonStat {
    name: string;
    totalAmount: number;
    sources: { path: string[]; amount: number }[];
}

/**
 * 聚合所有项目的末端节点数据
 * @param projects 所有项目列表
 * @param calculateFn 计算函数引用
 */
export const aggregateGlobalStats = (
    projects: ProjectData[],
    calculateFn: typeof calculateTree
): PersonStat[] => {
    const map = new Map<string, PersonStat>();

    projects.forEach((pj) => {
        pj.phases.forEach(ph => { 
            const restValue = calculatePhaseRestValue(ph);
            
            const results = calculateFn(ph.rootNode, restValue);

            const traverse = (node: AllocNode, path: string[]) => {
                const isLeaf = !node.children || node.children.length === 0;

                if (isLeaf) {
                    const nodeResult = results[node.id];
                    if (!nodeResult) return;

                    const current = map.get(node.name) || {
                        name: node.name,
                        totalAmount: 0,
                        sources: []
                    };

                    current.totalAmount += nodeResult.amount;
                    current.sources.push({
                        path: path,
                        amount: nodeResult.amount
                    });

                    map.set(node.name, current);
                } else {
                    node.children.forEach((child) => traverse(child, [...path, node.name]));
                }
            };

            traverse(ph.rootNode, [pj.name, ph.name]);
        })
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
};