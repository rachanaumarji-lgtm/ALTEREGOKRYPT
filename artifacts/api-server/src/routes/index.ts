import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import scenariosRouter from "./scenarios";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(scenariosRouter);

export default router;
