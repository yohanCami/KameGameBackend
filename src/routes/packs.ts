import express from "express";
import * as PacksController from "../controllers/packs";
import { isAdmin } from "../middlewares/isAdmin";

export const packsRouter = express();

packsRouter.get("/", PacksController.getAll);
packsRouter.get("/:id", PacksController.getOne);
packsRouter.post("/", isAdmin, PacksController.create);
packsRouter.patch("/:id", isAdmin, PacksController.updateOne);
packsRouter.delete("/:id", isAdmin, PacksController.deleteOne);

packsRouter.get("/:id/cards", PacksController.getCards);
packsRouter.post("/:id/cards", isAdmin, PacksController.addCards);
packsRouter.delete("/:id/cards/:cardId", isAdmin, PacksController.removeCard);
