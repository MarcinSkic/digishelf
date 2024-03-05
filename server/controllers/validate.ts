import { Request, Response } from "express";

export async function isValid(req: Request, res: Response) {
    res.json("ok");
}
