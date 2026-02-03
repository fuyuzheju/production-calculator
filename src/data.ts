import { z } from "zod";

export const RuleTypeSchema = z.enum(["FIXED", "PERCENTAGE", "REMAINDER"]);
export const NodeRuleSchema = z.object({
    type: RuleTypeSchema,
    value: z.number(),
});

export const AllocNodeSchema: z.ZodType<AllocNode> = z.lazy(() =>
    z.object({
        id: z.string(),
        name: z.string(),
        rule: NodeRuleSchema,
        children: z.array(AllocNodeSchema),
    })
);

export const PreAllocationRuleTypeSchema = z.enum(["FIXED", "PERCENTAGE"]);
export const PreAllocationRuleSchema = z.object({
    type: PreAllocationRuleTypeSchema,
    value: z.number(),
});

export const PreAllocationSchema = z.object({
    id: z.string(),
    name: z.string(),
    rule: PreAllocationRuleSchema,
});

export const NodeLayoutTypeSchema = z.enum(["collapsed", "horizontal", "vertical"]);

export const ProjectViewSchema = z.object({
    nodeLayouts: z.record(z.string(), NodeLayoutTypeSchema),
})

export const PhaseDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    phaseValue: z.number(),
    preAllocations: z.array(PreAllocationSchema),
    rootNode: AllocNodeSchema,
    view: ProjectViewSchema,
});

export const ProjectDataSchema = z.object({
    id: z.string(),
    name: z.string(),
    totalValue: z.number(),
    phases: z.array(PhaseDataSchema),
});

export const RuleType = RuleTypeSchema.enum;
export type RuleType = z.infer<typeof RuleTypeSchema>;
export type NodeRule = z.infer<typeof NodeRuleSchema>;
export interface AllocNode { // traversal type, you can't infer it from a schema
    id: string;
    name: string;
    rule: NodeRule;
    children: AllocNode[];
}
export const PreAllocationRuleType = PreAllocationRuleTypeSchema.enum;
export type PreAllocationRuleType = z.infer<typeof PreAllocationRuleTypeSchema>;
export type PreAllocationRule = z.infer<typeof PreAllocationRuleSchema>;
export type PreAllocation = z.infer<typeof PreAllocationSchema>;
export type NodeLayoutType = z.infer<typeof NodeLayoutTypeSchema>;
export type ProjectView = z.infer<typeof ProjectViewSchema>;
export type PhaseData = z.infer<typeof PhaseDataSchema>;
export type ProjectData = z.infer<typeof ProjectDataSchema>;

const DEFAULT_LAYOUT: NodeLayoutType = "vertical";
export const phaseViewRecover = (phase: PhaseData): void => {
    const nodeStack = [phase.rootNode];
    while (nodeStack.length > 0) {
        const currentNode = nodeStack.pop()!;
        if (!(currentNode.id in phase.view.nodeLayouts)) {
            phase.view.nodeLayouts[currentNode.id] = DEFAULT_LAYOUT;
        }
        currentNode.children.forEach(child => nodeStack.push(child));
    }
}
