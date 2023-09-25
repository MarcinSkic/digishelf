import Image from "../models/image.js";
import { Request, Response, NextFunction } from "express";
import { inspect } from "util";
import Debug from "debug";
import { ExtendedValidator } from "../scripts/customValidator.js";
import multer from 'multer';
const debug = Debug("project:dev");

const { param, body, validationResult } = ExtendedValidator();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export async function getCount(req: Request, res: Response) {
    const count = await Image.count();
    res.json({ count });
}

export async function getAll(req: Request, res: Response) {
    const images = await Image.find({}, { __v: 0 });
    res.json(images);
}

export const getOne = [
    param("id").isMongoId().withMessage("URL contains incorrect id"),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            validationResult(req).throw();
            const images = await Image.findById(req.params.id).exec();
            res.json({ data: images });
        } catch (e: any) {
            return next(e);
        }
    },
];

export const createOne = [
    upload.single('image'),
    async function (req: Request | any, res: Response) {
        if (!req.file)
            return res
                .status(400)
                .json({ acknowledged: false, message: 'No file uploaded' });

        const base64Image = req.file.buffer.toString('base64');

        try {
            const image = await Image.create({
                image: base64Image,
            });
            await image.save();

            return res.json({ acknowledged: true, created: image });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ acknowledged: false, message: 'Server error' });
        }
    },
];

export const updateOne = [
    param("id").isMongoId().withMessage("URL contains incorrect id"),
    upload.single('image'),
    async function (req: Request | any, res: Response, next: NextFunction) {
        try {
            validationResult(req).throw();

            if (!req.file)
                return res
                    .status(400)
                    .json({ acknowledged: false, message: 'No file uploaded' });

            const base64Image = req.file.buffer.toString('base64');

            const updateData = {
                image: base64Image,
            };

            const image = await Image.findByIdAndUpdate(req.params.id, updateData, { new: true });

            if (!image)
                return res
                    .status(404)
                    .json({ acknowledged: false, message: 'Image does not exist' });

            return res.json({ acknowledged: true, updated: image });
        } catch (error: any) {
            console.error(error);
            return next(error);
        }
    },
];

export const deleteOne = [
    param("id").isMongoId().withMessage("URL contains incorrect id"),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            validationResult(req).throw();

            const instance = await Image.findById(req.params.id);

            if (!instance) {
                return res.status(404).json({ error: "This image does not exist." });
            }

            const result = await Image.findByIdAndRemove(req.params.id);
            return res.json({ acknowledged: true, deleted: result });
        } catch (error) {
            return next(error);
        }
    },
];

export const showOne = [
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const images = await Image.findById(req.params.id).exec();

            if (!images) {
                return res.status(404).send('Image does not exist');
            }

            res.set('Content-Type', 'image/jpg');

            if (images.image) {
                const buffer = Buffer.from(images.image, 'base64');
                res.send(buffer);
            } else {
                return res.status(404).send('Base64 image does not exist');
            }
        } catch (e: any) {
            //console.log(res);
            return next(e);
        }
    },
];