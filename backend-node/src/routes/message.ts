import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Message } from "../entity/Message";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";

export async function getMyMessages(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const messageRepo = AppDataSource.getRepository(Message);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const messages = await messageRepo.find({
    where: { userId: user.id },
    order: { createdAt: "DESC" },
  });
  res.json(messages.map(mapMessageResponse));
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const messageRepo = AppDataSource.getRepository(Message);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { subject, content } = req.body;
  if (!subject?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Subject and content are required" });
    return;
  }

  const message = new Message();
  message.userId = user.id;
  message.subject = subject.trim();
  message.content = content.trim();
  message.status = "UNREAD";

  const saved = await messageRepo.save(message);
  res.status(201).json(mapMessageResponse(saved));
}

export async function getAllMessages(req: AuthRequest, res: Response): Promise<void> {
  const messageRepo = AppDataSource.getRepository(Message);
  const messages = await messageRepo
    .createQueryBuilder("m")
    .leftJoinAndSelect("m.user", "u")
    .orderBy("m.createdAt", "DESC")
    .getMany();

  res.json(messages.map(mapMessageResponse));
}

export async function getMessage(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid message ID" }); return; }
  const messageRepo = AppDataSource.getRepository(Message);
  const message = await messageRepo.findOne({
    where: { id },
    relations: ["user"],
  });
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json(mapMessageResponse(message));
}

export async function replyMessage(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid message ID" }); return; }
  const messageRepo = AppDataSource.getRepository(Message);
  const message = await messageRepo.findOne({ where: { id } });
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const { replyContent } = req.body;
  message.replyContent = replyContent || "";
  message.repliedAt = new Date();
  message.status = "REPLIED";

  const saved = await messageRepo.save(message);
  res.json(mapMessageResponse(saved));
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid message ID" }); return; }
  const messageRepo = AppDataSource.getRepository(Message);
  const message = await messageRepo.findOne({ where: { id } });
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  message.status = "READ";
  await messageRepo.save(message);
  res.json({ message: "OK" });
}

export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  const messageRepo = AppDataSource.getRepository(Message);
  const count = await messageRepo.count({ where: { status: "UNREAD" } });
  res.json({ count });
}

function mapMessageResponse(message: Message): any {
  return {
    id: message.id,
    userId: message.userId,
    userFullName: message.user?.fullName || "",
    userEmail: message.user?.email || "",
    userPhone: message.user?.phone || "",
    subject: message.subject,
    content: message.content,
    status: message.status,
    replyContent: message.replyContent,
    repliedAt: message.repliedAt,
    createdAt: message.createdAt,
  };
}
