"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePricingRule = exports.updatePricingRule = exports.createPricingRule = exports.getPricingRuleByCategory = exports.getPricingRuleById = exports.getAllPricingRules = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET all pricing rules
const getAllPricingRules = async (req, res) => {
    try {
        const pricingRules = await prisma.pricing_rules.findMany({
            orderBy: { id: "asc" },
        });
        res.status(200).json(pricingRules);
    }
    catch (error) {
        console.error("Error fetching pricing rules:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch pricing rules",
            error: errMsg,
        });
    }
};
exports.getAllPricingRules = getAllPricingRules;
// GET pricing rule by ID
const getPricingRuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = Number.parseInt(id);
        if (Number.isNaN(ruleId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        const pricingRule = await prisma.pricing_rules.findUnique({
            where: { id: ruleId },
        });
        if (!pricingRule) {
            res.status(404).json({
                message: "Pricing rule not found",
            });
            return;
        }
        res.status(200).json(pricingRule);
    }
    catch (error) {
        console.error("Error fetching pricing rule:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch pricing rule",
            error: errMsg,
        });
    }
};
exports.getPricingRuleById = getPricingRuleById;
// GET pricing rule by category
const getPricingRuleByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const pricingRule = await prisma.pricing_rules.findUnique({
            where: { category },
        });
        if (!pricingRule) {
            res.status(404).json({
                message: "Pricing rule not found for this category",
            });
            return;
        }
        res.status(200).json(pricingRule);
    }
    catch (error) {
        console.error("Error fetching pricing rule by category:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to fetch pricing rule by category",
            error: errMsg,
        });
    }
};
exports.getPricingRuleByCategory = getPricingRuleByCategory;
// POST create new pricing rule
const createPricingRule = async (req, res) => {
    try {
        const { category, markup_percentage } = req.body;
        // Validation
        if (!category || markup_percentage === undefined || markup_percentage === null) {
            res.status(400).json({
                message: "Category and markup_percentage are required",
            });
            return;
        }
        // Validate markup_percentage range
        const markupValue = Number(markup_percentage);
        if (markupValue < 0) {
            res.status(400).json({
                message: "Markup percentage cannot be negative",
            });
            return;
        }
        if (markupValue > 100) {
            res.status(400).json({
                message: "Markup percentage cannot exceed 100",
            });
            return;
        }
        // Check if category already exists
        const existingRule = await prisma.pricing_rules.findUnique({
            where: { category },
        });
        if (existingRule) {
            res.status(400).json({
                message: "Pricing rule with this category already exists",
            });
            return;
        }
        const newPricingRule = await prisma.pricing_rules.create({
            data: {
                category,
                markup_percentage: markupValue,
            },
        });
        res.status(201).json(newPricingRule);
    }
    catch (error) {
        console.error("Error creating pricing rule:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to create pricing rule",
            error: errMsg,
        });
    }
};
exports.createPricingRule = createPricingRule;
// PUT update pricing rule
const updatePricingRule = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = Number.parseInt(id);
        if (Number.isNaN(ruleId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        const { category, markup_percentage } = req.body;
        // Validation - at least one field must be provided
        if (!category && markup_percentage === undefined && markup_percentage === null) {
            res.status(400).json({
                message: "At least one field (category or markup_percentage) must be provided",
            });
            return;
        }
        // Validate markup_percentage if provided
        if (markup_percentage !== undefined && markup_percentage !== null) {
            const markupValue = Number(markup_percentage);
            if (markupValue < 0) {
                res.status(400).json({
                    message: "Markup percentage cannot be negative",
                });
                return;
            }
            if (markupValue > 100) {
                res.status(400).json({
                    message: "Markup percentage cannot exceed 100",
                });
                return;
            }
        }
        // Check if pricing rule exists
        const existingRule = await prisma.pricing_rules.findUnique({
            where: { id: ruleId },
        });
        if (!existingRule) {
            res.status(404).json({
                message: "Pricing rule not found",
            });
            return;
        }
        // If category is being updated, check if new category already exists
        if (category && category !== existingRule.category) {
            const categoryExists = await prisma.pricing_rules.findUnique({
                where: { category },
            });
            if (categoryExists) {
                res.status(400).json({
                    message: "Pricing rule with this category already exists",
                });
                return;
            }
        }
        const updatedPricingRule = await prisma.pricing_rules.update({
            where: { id: ruleId },
            data: {
                ...(category && { category }),
                ...(markup_percentage !== undefined && markup_percentage !== null && { markup_percentage: Number(markup_percentage) }),
            },
        });
        res.status(200).json(updatedPricingRule);
    }
    catch (error) {
        console.error("Error updating pricing rule:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to update pricing rule",
            error: errMsg,
        });
    }
};
exports.updatePricingRule = updatePricingRule;
// DELETE pricing rule
const deletePricingRule = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = Number.parseInt(id);
        if (Number.isNaN(ruleId)) {
            res.status(400).json({
                message: "ID must be a number",
            });
            return;
        }
        // Check if pricing rule exists
        const existingRule = await prisma.pricing_rules.findUnique({
            where: { id: ruleId },
        });
        if (!existingRule) {
            res.status(404).json({
                message: "Pricing rule not found",
            });
            return;
        }
        await prisma.pricing_rules.delete({
            where: { id: ruleId },
        });
        res.status(200).json({
            message: "Pricing rule deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting pricing rule:", error);
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            message: "Failed to delete pricing rule",
            error: errMsg,
        });
    }
};
exports.deletePricingRule = deletePricingRule;
