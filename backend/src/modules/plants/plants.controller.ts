import type { Request, Response } from 'express';
import * as plants from './plants.service.js';

export async function list(req: Request, res: Response) {
  res.json(await plants.list(req.valid.query, req.user));
}

export async function stats(_req: Request, res: Response) {
  res.json(await plants.stats());
}

export async function mine(req: Request, res: Response) {
  res.json({ items: await plants.mine(req.user!) });
}

export async function getById(req: Request, res: Response) {
  res.json(await plants.getById(req.valid.params.id, req.user));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await plants.create(req.valid.body, req.file, req.user!));
}

export async function update(req: Request, res: Response) {
  res.json(await plants.update(req.valid.params.id, req.valid.body, req.file, req.user!));
}

export async function remove(req: Request, res: Response) {
  await plants.remove(req.valid.params.id, req.user!);
  res.status(204).end();
}
