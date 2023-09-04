import { Request, Response, NextFunction, Router } from "express";
import movieRouter from "./api/movie.js";
import pieceOfWorkInstanceRouter from "./api/pieceOfWorkInstance.js";
import piecesOfAPIRouter from "./api/piecesOfAPI.js";
import personRouter from "./api/person.js";
import { validationResult } from "express-validator";
import { login, register } from "../controllers/user.js";
import { isValid } from "../controllers/validate.js";
import { jwtMiddleware } from "../middlewares.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);

router.get("/validate", jwtMiddleware, isValid);

router.use("/movie", jwtMiddleware, movieRouter);
router.use("/pieceOfWorkInstance", jwtMiddleware, pieceOfWorkInstanceRouter);
router.use("/piecesOfAPI", jwtMiddleware, piecesOfAPIRouter);
router.use("/person", jwtMiddleware, personRouter);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
        return res
            .status(422)
            .json({ acknowledged: false, errors: err.errors });
    }

    if (err.status === 401) {
        return res.status(401).json({
            acknowledged: false,
            errors: [
                {
                    msg: err.inner.message,
                },
            ],
        });
    }

    return next(err);
});

export default router;
