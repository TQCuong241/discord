import { GuildQueue } from "./queueTypes";
import { Message } from "discord.js";


export const queues = new Map<string, GuildQueue>();
export const controlMessages = new Map<string, Message>();
