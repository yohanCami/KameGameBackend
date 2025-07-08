import cors from "cors";
import express, { type NextFunction, type Request } from "express";
import morgan from "morgan";
import "dotenv/config";

import { isAuthenticated } from "./middlewares/isAuthenticated";
import { cardsRouter } from "./routes/cards";
import { cartRouter } from "./routes/cart";
import { packsRouter } from "./routes/packs";
import { usersRouter } from "./routes/user";
import { errorResponse, HttpStatus } from "./utils";

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(
	cors({
		origin: process.env.NODE_ENV !== "production" && "*",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	}),
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/user", usersRouter);
app.use("/cards", cardsRouter);
app.use("/packs", packsRouter);
app.use("/cart", isAuthenticated, cartRouter);

app.use(
	(err: Error, _req: Request, res: express.Response, _next: NextFunction) => {
		console.log("unhandled error:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"internal server error",
		);
	},
);

app.use((_req, res, _next) => {
	errorResponse(res, HttpStatus.NOT_FOUND, "not found");
});

app.listen(PORT, (err) => {
	if (err) {
		console.log(`failed to start server at port ${PORT}:`, err);
	} else {
		console.log(`listening on port ${PORT}`);
	}
});
