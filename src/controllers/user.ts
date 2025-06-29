import type { Request, Response } from "express";

export const signup = (req: Request, res: Response) => {
	res.send("sign up");
};

export const login = (req: Request, res: Response) => {
	res.send("login");
};

export const me = (req: Request, res: Response) => {
	res.send("me");
};
