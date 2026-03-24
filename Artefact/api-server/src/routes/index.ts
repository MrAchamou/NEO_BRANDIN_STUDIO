import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enhancePromptsRouter from "./openai/enhance-prompts";
import enhancePromptsVisualRouter from "./openai/enhance-prompts-visual";
import enhancePromptsVideoRouter from "./openai/enhance-prompts-video";
import enhancePromptsAdsRouter from "./openai/enhance-prompts-ads";
import enhancePromptsSoundRouter from "./openai/enhance-prompts-sound";
import enhancePromptsCopyRouter from "./openai/enhance-prompts-copy";
import enhancePromptsLaunchRouter from "./openai/enhance-prompts-launch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhancePromptsRouter);
router.use(enhancePromptsVisualRouter);
router.use(enhancePromptsVideoRouter);
router.use(enhancePromptsAdsRouter);
router.use(enhancePromptsSoundRouter);
router.use(enhancePromptsCopyRouter);
router.use(enhancePromptsLaunchRouter);

export default router;
