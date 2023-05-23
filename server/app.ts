import "./bin/loadEnv.js";
import "./bin/connectToDB.js";
import express, { Express } from "express";
import logger from "morgan";

import utilsRouter from "./routes/utils.js";

const app: Express = express();

app.use(logger("dev"));

app.get("/", (req, res) => {
    res.send(
        "You are calling Web Frameworks Project API, simple student project, there is no documentation so you have to guess endpoints yourself, have fun :)"
    );
});

app.use("/utils", utilsRouter);

export default app;
