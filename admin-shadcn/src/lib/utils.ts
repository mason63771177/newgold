import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并CSS类名的工具函数
 * @param inputs - CSS类名数组
 * @returns 合并后的CSS类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}