import express from "express";
import * as UserController from "../controllers/user";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export const usersRouter = express();

usersRouter.post("/signup", UserController.signup);
usersRouter.post("/login", UserController.login);
usersRouter.get("/", isAuthenticated, UserController.me);
