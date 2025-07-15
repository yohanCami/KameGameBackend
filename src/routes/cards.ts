import express from "express"
import * as CardsController from "../controllers/cards"
import { isAdmin } from "../middlewares/isAdmin"

export const cardsRouter = express()

cardsRouter.get("/", CardsController.getAll)
cardsRouter.get("/:id", CardsController.getOne)
cardsRouter.post("/", isAdmin, CardsController.create)
cardsRouter.patch("/:id", isAdmin, CardsController.updateOne)
cardsRouter.delete("/:id", isAdmin, CardsController.deleteOne)
