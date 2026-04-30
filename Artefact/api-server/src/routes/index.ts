import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scrapeGmbRouter from "./scrape-gmb";
import governanceRouter from "./governance";
import memoryRouter from "./memory";
import positioningRouter from "./positioning";
import growthRouter from "./growth";
import enhancePromptsRouter from "./openai/enhance-prompts";
import enhancePromptsVisualRouter from "./openai/enhance-prompts-visual";
import enhancePromptsVideoRouter from "./openai/enhance-prompts-video";
import enhancePromptsAdsRouter from "./openai/enhance-prompts-ads";
import enhancePromptsSoundRouter from "./openai/enhance-prompts-sound";
import enhancePromptsCopyRouter from "./openai/enhance-prompts-copy";
import enhancePromptsLaunchRouter from "./openai/enhance-prompts-launch";
import enhancePromptsChatbotRouter from "./openai/enhance-prompts-chatbot";
import enhancePromptsUpsellRouter from "./openai/enhance-prompts-upsell";
import enhancePromptsPerformanceRouter from "./openai/enhance-prompts-performance";
import personaVariantsRouter from "./openai/persona-variants";
import reviewPromptRouter from "./openai/review-prompt";

const router: IRouter = Router();

// ── v3.x — Routes stratégiques (Agency Mode) ───────────────────────────────
router.use(governanceRouter);
router.use(memoryRouter);
router.use(positioningRouter);
router.use(growthRouter);

// ── Core routes ────────────────────────────────────────────────────────────
router.use(healthRouter);
router.use(scrapeGmbRouter);
router.use(enhancePromptsRouter);
router.use(enhancePromptsVisualRouter);
router.use(enhancePromptsVideoRouter);
router.use(enhancePromptsAdsRouter);
router.use(enhancePromptsSoundRouter);
router.use(enhancePromptsCopyRouter);
router.use(enhancePromptsLaunchRouter);
router.use(enhancePromptsChatbotRouter);
router.use(enhancePromptsUpsellRouter);
router.use(enhancePromptsPerformanceRouter);
router.use(personaVariantsRouter);
router.use(reviewPromptRouter);

export default router;
