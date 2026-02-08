import { Message, ChatInputCommandInteraction } from "discord.js";

/**
 * Command handler interface cho prefix commands
 */
export interface PrefixCommandHandler {
  executeMessage: (msg: Message, args?: string[]) => Promise<void>;
}

/**
 * Command handler interface cho slash commands
 */
export interface SlashCommandHandler {
  execute: (interaction: ChatInputCommandInteraction, options?: any) => Promise<void>;
}

/**
 * Command handler interface cho commands hỗ trợ cả prefix và slash
 */
export interface CommandHandler extends PrefixCommandHandler, SlashCommandHandler {}

/**
 * Command metadata
 */
export interface CommandMetadata {
  name: string;
  aliases?: string[];
  requiresDefer?: boolean;
  handler: CommandHandler | PrefixCommandHandler | SlashCommandHandler | ((...args: any[]) => Promise<void>);
}

