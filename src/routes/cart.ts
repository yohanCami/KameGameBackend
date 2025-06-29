import express from "express";
import * as CartController from "../controllers/cart";

export const cartRouter = express();

cartRouter.get("/", CartController.getCart);
cartRouter.post("/", CartController.addItem);
cartRouter.patch("/:id", CartController.updateItemCount);
cartRouter.delete("/:id", CartController.deleteItem);
cartRouter.delete("/", CartController.clear);
