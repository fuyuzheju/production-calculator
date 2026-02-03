import { RuleType } from "./data";

const RULE_CONFIG = {
    [RuleType.PERCENTAGE]: { label: '比例', color: '#3b82f6', bg: '#eff6ff' },
    [RuleType.FIXED]: { label: '定额', color: '#10b981', bg: '#ecfdf5' },
    [RuleType.REMAINDER]: { label: '结余', color: '#8b5cf6', bg: '#f5f3ff' },
};
export default RULE_CONFIG;