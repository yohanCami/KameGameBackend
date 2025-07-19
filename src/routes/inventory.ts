import express from "express";
import * as InventoryController from "../controllers/inventory";

export const inventoryRouter = express();

inventoryRouter.get("/", InventoryController.getInventory)
