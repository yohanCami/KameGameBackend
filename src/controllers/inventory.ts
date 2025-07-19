import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/isAuthenticated";
import { search } from "../models/inventory";
import { inventorySearchSchema } from "../schemas/inventory";
import { errorResponse, HttpStatus, successResponse } from "../utils";

export const getInventory = async (req: AuthenticatedRequest, res: Response) => {
    const params = inventorySearchSchema.safeParse(req.query);
    if (!params.success) {
        errorResponse(
            res,
            HttpStatus.BAD_REQUEST,
            "invalid search params",
            params.error.issues
        );
        return;
    }

    const userName = req.user!.name;
    const [inventory, totalPages] = await search(userName, params.data);
    
    successResponse(res, HttpStatus.OK, "", {
        results: inventory,
        totalPages: totalPages
    })
}
