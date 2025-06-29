import express from "express";
import { usersRouter } from "./routes/user";
import { cardsRouter } from "./routes/cards";
import { packsRouter } from "./routes/packs";
import { cartRouter } from "./routes/cart";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use("/user", usersRouter);
app.use("/cards", cardsRouter);
app.use("/packs", packsRouter);
app.use("/cart", isAuthenticated, cartRouter);

app.listen(PORT, (err) => {
	if (err) {
		console.log(`failed to start server at port ${PORT}:`, err);
	} else {
		console.log(`listening on port ${PORT}`);
	}
});
