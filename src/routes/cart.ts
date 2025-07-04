import express from "express";
import * as CartController from "../controllers/cart";

export const cartRouter = express();

cartRouter.get("/", CartController.getCart);
cartRouter.post("/", CartController.addItem);
cartRouter.put("/", CartController.updateItemCount);
cartRouter.delete("/:category/:id", CartController.deleteItem);
cartRouter.delete("/", CartController.clear);
