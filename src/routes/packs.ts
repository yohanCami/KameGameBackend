import express from "express";
import * as PacksController from "../controllers/packs";
import { isAdmin } from "../middlewares/isAdmin";

export const packsRouter = express();

packsRouter.get("/", PacksController.getAll);
packsRouter.get("/:id", PacksController.getOne);
packsRouter.post("/", isAdmin, PacksController.create);
packsRouter.put("/:id", isAdmin, PacksController.updateOne);
packsRouter.delete("/:id", isAdmin, PacksController.deleteOne);
