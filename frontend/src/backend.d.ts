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
    stableId: bigint;
    title: string;
    availableChapters: number;
    chaptersRead: number;
    completed: boolean;
    bookmarks: Array<bigint>;
    synopsis: string;
    genres: Array<string>;
    notes: string;
    coverImages: Array<ExternalBlob>;
    rating: number;
    alternateTitles: Array<string>;
    isBookmarked: boolean;
}
export interface UpdateFields {
    stableId: bigint;
    title?: string;
    availableChapters?: number;
    chaptersRead?: number;
    completed?: boolean;
    bookmarks?: Array<bigint>;
    synopsis?: string;
    genres?: Array<string>;
    notes?: string;
    coverImages?: Array<ExternalBlob>;
    rating?: number;
    alternateTitles?: Array<string>;
    isBookmarked?: boolean;
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
    addEntry(manga: MangaEntry): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteEntry(stableId: bigint): Promise<void>;
    deleteGenre(genreToDelete: string): Promise<void>;
    getAllEntries(): Promise<Array<MangaEntry>>;
    getAllEntriesWithStableIds(): Promise<Array<[bigint, MangaEntry]>>;
    getAllGenres(): Promise<Array<string>>;
    getAvailableGenres(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntry(stableId: bigint): Promise<MangaEntry>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isReady(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleBookmark(stableId: bigint): Promise<boolean>;
    updateAvailableGenres(genres: Array<string>): Promise<void>;
    updateCompletionStatus(stableId: bigint, completed: boolean): Promise<boolean>;
    updateEntry(stableId: bigint, updates: UpdateFields): Promise<MangaEntry>;
    updateNotes(stableId: bigint, newNotes: string): Promise<string>;
    updateRating(stableId: bigint, rating: number): Promise<number>;
}
