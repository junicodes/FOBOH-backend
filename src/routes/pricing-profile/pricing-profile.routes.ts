import { Router } from "express";
import { pricingProfileController } from "../../controllers/pricing-profile/pricing-profile.controller";

/**
 * @swagger
 * /api/v1/pricing-profiles:
 *   post:
 *     summary: Create a new pricing profile (calculates prices and returns pricing table)
 *     tags: [Pricing Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - adjustmentType
 *               - adjustmentValue
 *               - incrementType
 *               - productIds
 *             properties:
 *               name:
 *                 type: string
 *               adjustmentType:
 *                 type: string
 *                 enum: [fixed, dynamic]
 *               adjustmentValue:
 *                 type: number
 *               incrementType:
 *                 type: string
 *                 enum: [increase, decrease]
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Pricing profile created successfully with pricing table
 *   get:
 *     summary: Get all pricing profiles
 *     tags: [Pricing Profiles]
 *     responses:
 *       200:
 *         description: List of all pricing profiles
 */
const router = Router();

router.post("/", pricingProfileController.create);
router.get("/", pricingProfileController.getAll);

/**
 * @swagger
 * /api/v1/pricing-profiles/{id}:
 *   get:
 *     summary: Get pricing profile by ID
 *     tags: [Pricing Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pricing profile details
 *   put:
 *     summary: Update pricing profile
 *     tags: [Pricing Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               adjustmentType:
 *                 type: string
 *                 enum: [fixed, dynamic]
 *               adjustmentValue:
 *                 type: number
 *               incrementType:
 *                 type: string
 *                 enum: [increase, decrease]
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Pricing profile updated successfully
 *   delete:
 *     summary: Delete pricing profile
 *     tags: [Pricing Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pricing profile deleted successfully
 */
router.get("/:id", pricingProfileController.getById);
router.put("/:id", pricingProfileController.update);
router.delete("/:id", pricingProfileController.delete);

export default router;