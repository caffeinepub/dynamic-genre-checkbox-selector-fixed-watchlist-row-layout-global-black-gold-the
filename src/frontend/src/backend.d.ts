import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MangaEntry {
    title: string;
    availableChapters: bigint;
    chaptersRead: bigint;
    completed: boolean;
    bookmarks: Array<bigint>;
    synopsis: string;
    genres: Array<string>;
    notes: string;
    coverImages: Array<ExternalBlob>;
    rating: number;
    alternateTitles: Array<string>;
}
export interface MangaPage {
    pageNumber: bigint;
    entries: Array<MangaEntry>;
    totalPages: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEntry(id: string, manga: MangaEntry): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteEntry(id: string): Promise<void>;
    getAllEntries(): Promise<Array<MangaEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntry(id: string): Promise<MangaEntry>;
    getMangaPage(pageNumber: bigint): Promise<MangaPage>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEntry(id: string, manga: MangaEntry): Promise<void>;
}
