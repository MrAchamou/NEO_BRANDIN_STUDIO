import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enhancePromptsRouter from "./openai/enhance-prompts";
import enhancePromptsVisualRouter from "./openai/enhance-prompts-visual";
import enhancePromptsVideoRouter from "./openai/enhance-prompts-video";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhancePromptsRouter);
router.use(enhancePromptsVisualRouter);
router.use(enhancePromptsVideoRouter);

export default router;
